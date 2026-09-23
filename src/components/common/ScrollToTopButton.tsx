import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={cn(
        'fixed z-40 transition-all duration-300 ease-in-out print:hidden',
        // Mobile: above bottom bar (bottom-20), Desktop: bottom-6
        'bottom-20 right-3 xs:right-4 md:bottom-6 md:right-6',
        'w-10 h-10 sm:w-11 sm:h-11 rounded-full',
        'bg-neutral-900 text-white border border-neutral-700/80 shadow-lg',
        'flex items-center justify-center hover:bg-brand hover:border-brand',
        'transition-all duration-200 transform active:scale-95 animate-in fade-in zoom-in-75 cursor-pointer'
      )}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.2px]" />
    </button>
  );
};
