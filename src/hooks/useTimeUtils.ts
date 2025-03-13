
import { useState, useCallback } from "react";

/**
 * Hook that provides time-related utility functions
 */
export const useTimeUtils = (lastRefreshedDate: Date) => {
  const getTimeSinceLastRefresh = useCallback((): string => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins === 1) {
      return '1 minute ago';
    } else {
      return `${diffMins} minutes ago`;
    }
  }, [lastRefreshedDate]);

  return {
    getTimeSinceLastRefresh
  };
};
