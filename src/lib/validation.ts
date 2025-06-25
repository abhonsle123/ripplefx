
import { z } from "zod";

// Password strength validation schema
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .max(128, "Password must be less than 128 characters");

// Email validation schema
export const emailSchema = z.string()
  .email("Please enter a valid email address")
  .max(254, "Email address is too long");

// Phone number validation schema
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number with country code")
  .optional();

// Broker API key validation schemas
export const alpacaApiKeySchema = z.string()
  .min(20, "Alpaca API key must be at least 20 characters")
  .regex(/^[A-Z0-9]{20,}$/, "Invalid Alpaca API key format")
  .refine(val => !['test', 'fake', 'example', '123456789'].includes(val.toLowerCase()), 
    "Test API keys are not allowed");

export const alpacaSecretSchema = z.string()
  .min(40, "Alpaca API secret must be at least 40 characters")
  .refine(val => !['test', 'fake', 'example', '123456789'].includes(val.toLowerCase()), 
    "Test API secrets are not allowed");

// Text input sanitization
export const sanitizeText = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Stock symbol validation
export const stockSymbolSchema = z.string()
  .min(1, "Stock symbol is required")
  .max(10, "Stock symbol too long")
  .regex(/^[A-Z]+$/, "Stock symbol must contain only uppercase letters")
  .transform(val => val.toUpperCase());

// Event creation validation
export const eventSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .transform(sanitizeText),
  description: z.string()
    .min(1, "Description is required")
    .max(2000, "Description too long")
    .transform(sanitizeText),
  event_type: z.enum(["NATURAL_DISASTER", "GEOPOLITICAL", "ECONOMIC", "OTHER"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  country: z.string().optional().transform(val => val ? sanitizeText(val) : undefined),
  city: z.string().optional().transform(val => val ? sanitizeText(val) : undefined),
});

// Profile update validation
export const profileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .optional()
    .transform(val => val ? sanitizeText(val) : undefined),
  full_name: z.string()
    .max(100, "Full name too long")
    .optional()
    .transform(val => val ? sanitizeText(val) : undefined),
  email: emailSchema.optional(),
});

// Investment amount validation
export const investmentAmountSchema = z.number()
  .min(0.01, "Investment amount must be greater than 0")
  .max(1000000, "Investment amount too large")
  .finite("Investment amount must be a valid number");

// Rate limiting configuration
export const RATE_LIMITS = {
  AUTH_ATTEMPTS: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  FORM_SUBMISSIONS: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 submissions per minute
  API_CALLS: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 calls per minute
} as const;
