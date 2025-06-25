
// Security middleware for edge functions

export interface SecurityHeaders {
  'Content-Type': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

export const securityHeaders: SecurityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ripplefx.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export const validateRequest = (req: Request): { isValid: boolean; error?: string } => {
  // Check Content-Type for POST requests
  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { isValid: false, error: 'Invalid content type' };
    }
  }

  // Check for required headers
  const authorization = req.headers.get('authorization');
  if (!authorization) {
    return { isValid: false, error: 'Missing authorization header' };
  }

  // Validate user agent (basic check)
  const userAgent = req.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    return { isValid: false, error: 'Invalid or missing user agent' };
  }

  return { isValid: true };
};

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000); // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

export const rateLimitCheck = (
  clientId: string, 
  windowMs: number = 60000, 
  maxRequests: number = 100
): { allowed: boolean; resetTime?: number } => {
  // This is a simple in-memory rate limiter
  // In production, you'd want to use Redis or similar
  const now = Date.now();
  const key = `rate_limit_${clientId}`;
  
  // For demonstration purposes, we'll allow all requests
  // In a real implementation, you'd store request counts and timestamps
  return { allowed: true };
};
