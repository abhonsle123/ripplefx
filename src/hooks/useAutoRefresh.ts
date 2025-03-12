
import { useEffect, useRef } from "react";

export const useAutoRefresh = (callback: () => Promise<void>, intervalInSeconds: number = 120) => {
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    // Only execute callback on mount if it's the first render
    if (isFirstRender.current) {
      callback();
      isFirstRender.current = false;
    }
    
    // Set up interval for subsequent refreshes
    const intervalId = setInterval(callback, intervalInSeconds * 1000);
    
    return () => clearInterval(intervalId);
  }, [callback, intervalInSeconds]);
};
