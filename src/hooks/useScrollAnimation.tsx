
import { useEffect, useState, useRef } from 'react';

type AnimationVariant = 'fadeUp' | 'scaleIn' | 'revealLeft' | 'revealRight' | 'default';

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  variant?: AnimationVariant;
  delay?: number;
}

export const useScrollAnimation = ({
  threshold = 0.1,
  rootMargin = '0px',
  variant = 'default',
  delay = 0
}: ScrollAnimationOptions = {}) => {
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
        rootMargin,
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
  }, [threshold, rootMargin]);

  // Helper to get animation classes based on variant
  const getAnimationClasses = () => {
    if (!isVisible) return 'opacity-0';
    
    const baseClasses = 'transition-all duration-1000 opacity-100';
    
    switch (variant) {
      case 'fadeUp':
        return `${baseClasses} animate-fadeInUp`;
      case 'scaleIn':
        return `${baseClasses} animate-scaleIn`;
      case 'revealLeft':
        return `${baseClasses} animate-revealLeft`;
      case 'revealRight':
        return `${baseClasses} animate-revealRight`;
      default:
        return `${baseClasses} translate-y-0`;
    }
  };

  return { 
    ref, 
    isVisible,
    animationClasses: getAnimationClasses(),
    style: delay ? { animationDelay: `${delay}ms` } : {} 
  };
};
