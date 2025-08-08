export interface ProcessedInput {
  cleaned: string;
  tooLong: boolean;
  originalLength: number;
}

export interface AIResponse {
  bullets: string[];
  truncated: boolean;
  error?: string;
}

export interface APIError {
  message: string;
  code: string;
  status: number;
}

export interface CacheEntry {
  bullets: string[];
  truncated: boolean;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
}
