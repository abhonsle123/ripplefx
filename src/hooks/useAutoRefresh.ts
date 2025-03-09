
import { useEffect } from "react";

export const useAutoRefresh = (callback: () => Promise<void>, intervalInSeconds: number = 120) => {
  useEffect(() => {
    // Execute callback immediately on mount
    callback();
    
    // Set up interval
    const intervalId = setInterval(callback, intervalInSeconds * 1000);
    
    return () => clearInterval(intervalId);
  }, [callback, intervalInSeconds]);
};
