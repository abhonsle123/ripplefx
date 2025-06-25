
import { useState, useCallback, useRef } from "react";
import { RATE_LIMITS } from "@/lib/validation";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitState {
  attempts: number[];
  blocked: boolean;
  resetTime?: number;
}

export const useRateLimit = (key: keyof typeof RATE_LIMITS) => {
  const config = RATE_LIMITS[key];
  const stateRef = useRef<RateLimitState>({ attempts: [], blocked: false });

  const isRateLimited = useCallback((): boolean => {
    const now = Date.now();
    const state = stateRef.current;
    
    // Remove old attempts outside the window
    state.attempts = state.attempts.filter(time => now - time < config.windowMs);
    
    // Check if we're still blocked
    if (state.blocked && state.resetTime && now >= state.resetTime) {
      state.blocked = false;
      state.resetTime = undefined;
    }
    
    return state.blocked || state.attempts.length >= config.maxAttempts;
  }, [config]);

  const recordAttempt = useCallback((): boolean => {
    const now = Date.now();
    const state = stateRef.current;
    
    if (isRateLimited()) {
      return false;
    }
    
    state.attempts.push(now);
    
    // Block if we've exceeded the limit
    if (state.attempts.length >= config.maxAttempts) {
      state.blocked = true;
      state.resetTime = now + config.windowMs;
    }
    
    return true;
  }, [config, isRateLimited]);

  const getRemainingTime = useCallback((): number => {
    const state = stateRef.current;
    if (!state.blocked || !state.resetTime) return 0;
    return Math.max(0, state.resetTime - Date.now());
  }, []);

  const reset = useCallback(() => {
    stateRef.current = { attempts: [], blocked: false };
  }, []);

  return {
    isRateLimited,
    recordAttempt,
    getRemainingTime,
    reset
  };
};
