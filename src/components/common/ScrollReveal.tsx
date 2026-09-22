import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  delayMs?: number;
  durationMs?: number;
  threshold?: number;
  className?: string;
  as?: React.ElementType;
}

/**
 * Lightweight ScrollReveal component.
 * - Triggers subtle fade/translate entrance animations when elements enter viewport.
 * - Strictly respects prefers-reduced-motion media query.
 * - Does not cause layout shifts.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay,
  delayMs = 0,
  durationMs = 600,
  threshold = 0.15,
  className,
  as: Component = 'div',
}) => {
  const actualDelay = delay ?? delayMs;
  const [isRevealed, setIsRevealed] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check if user has reduced motion enabled
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [threshold]);

  const getTransformClasses = () => {
    if (isRevealed) return 'opacity-100 translate-x-0 translate-y-0';

    switch (direction) {
      case 'up':
        return 'opacity-0 translate-y-6';
      case 'down':
        return 'opacity-0 -translate-y-6';
      case 'left':
        return 'opacity-0 translate-x-6';
      case 'right':
        return 'opacity-0 -translate-x-6';
      case 'fade':
      default:
        return 'opacity-0';
    }
  };

  return (
    <Component
      ref={elementRef}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${actualDelay}ms`,
      }}
      className={cn(
        'transition-all ease-out transform motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100',
        getTransformClasses(),
        className
      )}
    >
      {children}
    </Component>
  );
};
