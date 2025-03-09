
import { useEffect, useState, useRef } from 'react';

export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update state when component comes into view
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once the animation has fired, we can stop observing
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold // percentage of the element that needs to be visible
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};
