import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, ShieldAlert } from 'lucide-react';
import { LightboxModal } from '../common/LightboxModal';
import { DemoImage } from '../../data/demoMedia';

export interface RoomGalleryProps {
  roomName: string;
  images: string[];
}

export const RoomGallery: React.FC<RoomGalleryProps> = ({ roomName, images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Convert raw URLs to DemoImage format for LightboxModal
  const lightboxImages: DemoImage[] = images.map((url, idx) => ({
    id: `room-img-${idx}`,
    url,
    alt: `${roomName} photo view ${idx + 1} (Demo Stock)`,
    category: 'rooms',
    caption: `${roomName} — View ${idx + 1} of ${images.length}`,
    isDemoStock: true,
  }));

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Large Image */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-card overflow-hidden bg-neutral-100 border border-neutral-border shadow-card group">
        <img
          src={images[activeIndex]}
          alt={`${roomName} view ${activeIndex + 1} (Demo Image)`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Demo Notice Banner */}
        <div className="absolute top-3 left-3 bg-neutral-dark/80 backdrop-blur-sm text-white px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-feedback-warning" />
          <span>Demo Room Photography</span>
        </div>

        {/* Fullscreen Expand Action */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label="Open fullscreen photo gallery"
          className="absolute top-3 right-3 p-2 rounded-lg bg-neutral-dark/70 hover:bg-neutral-dark text-white backdrop-blur-sm transition-all opacity-90 hover:opacity-100 shadow-sm"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Previous & Next Navigation Overlay Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous room photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-dark backdrop-blur-sm shadow-md transition-all focus-visible:outline-brand"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next room photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-dark backdrop-blur-sm shadow-md transition-all focus-visible:outline-brand"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        <div className="absolute bottom-3 right-3 bg-neutral-dark/75 backdrop-blur-sm text-white px-2.5 py-1 rounded text-xs font-medium">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View ${roomName} photo ${idx + 1}`}
              className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${
                activeIndex === idx
                  ? 'border-brand shadow-sm ring-1 ring-brand'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Accessible Fullscreen Lightbox Modal */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={lightboxImages}
        currentIndex={activeIndex}
        onIndexChange={setActiveIndex}
      />
    </div>
  );
};
