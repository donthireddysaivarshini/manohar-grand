import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DemoImage } from '../../data/demoMedia';

export interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: DemoImage[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
}) => {
  const handlePrev = useCallback(() => {
    onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery lightbox preview"
    >
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between text-white py-2 z-10" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs font-medium tracking-wider text-neutral-300">
          {currentIndex + 1} of {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image lightbox"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image View & Navigation Controls */}
      <div
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImg.url}
          alt={currentImg.alt}
          className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl transition-all select-none"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors backdrop-blur-sm border border-white/20 focus-visible:outline-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors backdrop-blur-sm border border-white/20 focus-visible:outline-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Caption Bar */}
      <div className="w-full max-w-2xl text-center text-white py-3 z-10" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-neutral-100">{currentImg.caption}</p>
        <span className="text-[11px] text-neutral-400 block mt-1">
          Demo stock image for layout preview
        </span>
      </div>
    </div>
  );
};
