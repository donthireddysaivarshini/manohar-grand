import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Automatically scrolls window to top on route change.
 */
export const ScrollToTopOnNavigate: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
};

/**
 * Floating Back-To-Top button that appears when user scrolls down.
 */
export const BackToTopButton: React.FC = () => {
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
      aria-label="Scroll to top of page"
      className={cn(
        'fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-xl transition-all duration-300 transform',
        'bg-neutral-dark text-white hover:bg-brand hover:scale-110 active:scale-95 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
        'print:hidden flex items-center justify-center'
      )}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};

export const ScrollToTop: React.FC = () => {
  return (
    <>
      <ScrollToTopOnNavigate />
      <BackToTopButton />
    </>
  );
};
