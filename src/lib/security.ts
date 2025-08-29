/**
 * Security utilities for input validation and sanitization
 */

// Patterns that could indicate malicious content
const MALICIOUS_PATTERNS = {
  // XSS attempts
  scriptTags: /<script[^>]*>.*?<\/script>/gi,
  javascriptProtocol: /javascript:/gi,
  dataProtocol: /data:/gi,
  vbscriptProtocol: /vbscript:/gi,
  
  // HTML injection
  htmlTags: /<\/?[a-zA-Z][^>]*>/g,
  
  // Command injection attempts - more specific to avoid removing legitimate parentheses
  commandInjection: /[;&|`$[\]{}]/g,
  
  // SQL injection patterns
  sqlInjection: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/gi,
  
  // URL injection
  urlInjection: /(https?:\/\/|ftp:\/\/|file:\/\/)/gi,
  
  // File path attempts
  filePath: /(\.\.\/|\.\.\\)/g,
  
  // Special characters that could be used for injection
  dangerousChars: /[<>\"'&]/g,
};

// Suspicious patterns that should trigger warnings
const SUSPICIOUS_PATTERNS = {
  // Potential encoding attempts
  encoding: /(%[0-9a-fA-F]{2}|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4})/g,
  
  // Unusual character sequences
  unusualChars: /[^\x20-\x7E\n\r\t]/g,
  
  // Repeated characters (potential DoS)
  repeatedChars: /(.)\1{10,}/g,
};

export interface SecurityCheckResult {
  isSafe: boolean;
  threats: string[];
  warnings: string[];
  sanitizedInput: string;
}

/**
 * Comprehensive security check for user input
 */
export function checkInputSecurity(input: string): SecurityCheckResult {
  const threats: string[] = [];
  const warnings: string[] = [];
  let sanitizedInput = input;

  // Check for malicious patterns
  if (MALICIOUS_PATTERNS.scriptTags.test(input)) {
    threats.push('Script tag injection detected');
    sanitizedInput = sanitizedInput.replace(MALICIOUS_PATTERNS.scriptTags, '');
  }

  if (MALICIOUS_PATTERNS.javascriptProtocol.test(input)) {
    threats.push('JavaScript protocol injection detected');
    sanitizedInput = sanitizedInput.replace(MALICIOUS_PATTERNS.javascriptProtocol, '');
  }

  if (MALICIOUS_PATTERNS.dataProtocol.test(input)) {
    threats.push('Data protocol injection detected');
    sanitizedInput = sanitizedInput.replace(MALICIOUS_PATTERNS.dataProtocol, '');
  }

  if (MALICIOUS_PATTERNS.htmlTags.test(input)) {
    threats.push('HTML tag injection detected');
    sanitizedInput = sanitizedInput.replace(MALICIOUS_PATTERNS.htmlTags, '');
  }

  if (MALICIOUS_PATTERNS.commandInjection.test(input)) {
    threats.push('Command injection attempt detected');
    sanitizedInput = sanitizedInput.replace(MALICIOUS_PATTERNS.commandInjection, '');
  }

  if (MALICIOUS_PATTERNS.sqlInjection.test(input)) {
    threats.push('SQL injection pattern detected');
    sanitizedInput = sanitizedInput.replace(MALICIOUS_PATTERNS.sqlInjection, '');
  }

  if (MALICIOUS_PATTERNS.urlInjection.test(input)) {
    threats.push('URL injection attempt detected');
    sanitizedInput = sanitizedInput.replace(MALICIOUS_PATTERNS.urlInjection, '');
  }

  if (MALICIOUS_PATTERNS.filePath.test(input)) {
    threats.push('File path traversal attempt detected');
    sanitizedInput = sanitizedInput.replace(MALICIOUS_PATTERNS.filePath, '');
  }

  // Check for suspicious patterns
  if (SUSPICIOUS_PATTERNS.encoding.test(input)) {
    warnings.push('Potential encoding attempt detected');
  }

  if (SUSPICIOUS_PATTERNS.unusualChars.test(input)) {
    warnings.push('Unusual characters detected');
  }

  if (SUSPICIOUS_PATTERNS.repeatedChars.test(input)) {
    warnings.push('Excessive repeated characters detected');
  }

  // Additional checks
  if (input.length > 10000) {
    threats.push('Input too long (potential DoS)');
  }

  // Check for null bytes
  if (input.includes('\0')) {
    threats.push('Null byte injection detected');
    sanitizedInput = sanitizedInput.replace(/\0/g, '');
  }

  // Check for control characters (except newlines and tabs)
  const controlChars = input.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
  if (controlChars) {
    threats.push('Control characters detected');
    sanitizedInput = sanitizedInput.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  const isSafe = threats.length === 0;

  return {
    isSafe,
    threats,
    warnings,
    sanitizedInput: sanitizedInput.trim(),
  };
}

/**
 * Log security events for monitoring
 */
export function logSecurityEvent(
  event: 'threat' | 'warning' | 'blocked',
  details: string,
  input: string,
  ip?: string
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    inputLength: input.length,
    ip: ip || 'unknown',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
  };

  // In production, you'd want to send this to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    console.warn('SECURITY EVENT:', logEntry);
    // TODO: Send to security monitoring service (e.g., Sentry, LogRocket, etc.)
  } else {
    console.warn('SECURITY EVENT (DEV):', logEntry);
  }
}

/**
 * Rate limit based on security threats
 */
export function shouldRateLimitByThreats(threats: string[]): boolean {
  const highRiskThreats = threats.filter(threat => 
    threat.includes('injection') || 
    threat.includes('script') || 
    threat.includes('command')
  );
  
  return highRiskThreats.length >= 2;
}
