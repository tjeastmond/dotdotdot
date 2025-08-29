import { checkInputSecurity, logSecurityEvent, shouldRateLimitByThreats } from './security';

describe('Security Functions', () => {
  describe('checkInputSecurity', () => {
    it('should detect script tag injection', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Script tag injection detected');
      expect(result.sanitizedInput).toBe('Hello  world');
    });

    it('should detect JavaScript protocol injection', () => {
      const input = 'Click here: javascript:alert("xss")';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('JavaScript protocol injection detected');
      expect(result.sanitizedInput).toBe('Click here: alert("xss")');
    });

    it('should detect HTML tag injection', () => {
      const input = 'Text with <b>bold</b> and <i>italic</i> tags';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('HTML tag injection detected');
      expect(result.sanitizedInput).toBe('Text with bold and italic tags');
    });

    it('should detect command injection attempts', () => {
      const input = 'test; rm -rf /';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Command injection attempt detected');
      expect(result.sanitizedInput).toBe('test rm -rf /');
    });

    it('should detect SQL injection patterns', () => {
      const input = 'user input UNION SELECT * FROM users';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('SQL injection pattern detected');
      expect(result.sanitizedInput).toBe('user input   * FROM users');
    });

    it('should detect URL injection attempts', () => {
      const input = 'Check out https://malicious.com';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('URL injection attempt detected');
      expect(result.sanitizedInput).toBe('Check out malicious.com');
    });

    it('should detect file path traversal attempts', () => {
      const input = 'file path: ../../../etc/passwd';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('File path traversal attempt detected');
      expect(result.sanitizedInput).toBe('file path: etc/passwd');
    });

    it('should detect null byte injection', () => {
      const input = 'text\0with\0null\0bytes';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Null byte injection detected');
      expect(result.sanitizedInput).toBe('textwithnullbytes');
    });

    it('should detect control characters', () => {
      const input = 'text\x01with\x02control\x03chars';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Control characters detected');
      expect(result.sanitizedInput).toBe('textwithcontrolchars');
    });

    it('should detect excessive input length', () => {
      const input = 'a'.repeat(10001);
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Input too long (potential DoS)');
    });

    it('should detect suspicious encoding attempts', () => {
      const input = 'text with %20 encoding and \\x20 hex';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(true);
      expect(result.warnings).toContain('Potential encoding attempt detected');
    });

    it('should detect unusual characters', () => {
      const input = 'text with 🚀 emoji and special chars';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(true);
      expect(result.warnings).toContain('Unusual characters detected');
    });

    it('should detect repeated characters', () => {
      const input = 'text with aaaaaaaaaaaaaaaaaaaaaa repeated';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(true);
      expect(result.warnings).toContain('Excessive repeated characters detected');
    });

    it('should allow safe input', () => {
      const input = 'This is a normal, safe text input with punctuation!';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(true);
      expect(result.threats).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.sanitizedInput).toBe(input);
    });

    it('should preserve newlines and tabs', () => {
      const input = 'Line 1\nLine 2\n\tIndented line';
      const result = checkInputSecurity(input);
      
      expect(result.isSafe).toBe(true);
      expect(result.sanitizedInput).toBe(input);
    });
  });

  describe('shouldRateLimitByThreats', () => {
    it('should rate limit high-risk threats', () => {
      const threats = ['Script tag injection detected', 'Command injection attempt detected'];
      const result = shouldRateLimitByThreats(threats);
      
      expect(result).toBe(true);
    });

    it('should not rate limit low-risk threats', () => {
      const threats = ['HTML tag injection detected'];
      const result = shouldRateLimitByThreats(threats);
      
      expect(result).toBe(false);
    });

    it('should not rate limit when no threats', () => {
      const threats: string[] = [];
      const result = shouldRateLimitByThreats(threats);
      
      expect(result).toBe(false);
    });
  });

  describe('logSecurityEvent', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log security events', () => {
      logSecurityEvent('threat', 'Test threat', 'test input', '127.0.0.1');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'SECURITY EVENT (DEV):',
        expect.objectContaining({
          event: 'threat',
          details: 'Test threat',
          inputLength: 10,
          ip: '127.0.0.1'
        })
      );
    });

    it('should handle missing IP', () => {
      logSecurityEvent('warning', 'Test warning', 'test input');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'SECURITY EVENT (DEV):',
        expect.objectContaining({
          ip: 'unknown'
        })
      );
    });
  });
});
