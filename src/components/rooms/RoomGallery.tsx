import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, ImageIcon } from 'lucide-react';
import { LightboxModal, LightboxImageItem } from '../common/LightboxModal';
import { ApiRoomImage } from '../../types/booking';
import { NEUTRAL_ROOM_PLACEHOLDER, getRoomImageUrl } from '../../utils/mediaUtils';

export interface RoomGalleryProps {
  roomName: string;
  images?: Array<ApiRoomImage | string>;
}

/**
 * Dynamic Room Gallery component.
 * - Gracefully handles: 0 images, 1 image, 2 images, 3 images, 4 images, and 5+ images.
 * - Zero images: Clean intentional placeholder state.
 * - 1 image: Hero presentation without broken controls/thumbnails.
 * - 2+ images: Interactive slider + thumbnail strip with responsive layout.
 * - Integrated accessible lightbox with keyboard navigation.
 */
export const RoomGallery: React.FC<RoomGalleryProps> = ({ roomName, images = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Normalize image objects/strings to standard LightboxImageItem format
  const normalizedImages: LightboxImageItem[] = [];
  images.forEach((img, idx) => {
    if (typeof img === 'string') {
      const url = img.trim();
      if (url) {
        normalizedImages.push({
          id: `room-img-${idx}`,
          url,
          alt: `${roomName} photo ${idx + 1}`,
          caption: `${roomName} — View ${idx + 1} of ${images.length}`,
        });
      }
    } else if (img) {
      const url = getRoomImageUrl(img);
      if (url && url !== NEUTRAL_ROOM_PLACEHOLDER) {
        normalizedImages.push({
          id: img.id || `room-img-${idx}`,
          url,
          alt: img.alt_text || `${roomName} photo ${idx + 1}`,
          caption: img.caption || `${roomName} — View ${idx + 1} of ${images.length}`,
        });
      }
    }
  });

  const totalImages = normalizedImages.length;

  // 0 images: Clean intentional placeholder state
  if (totalImages === 0) {
    return (
      <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center p-6 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-400 mb-3 shadow-inner">
          <ImageIcon className="w-7 h-7 text-neutral-400" />
        </div>
        <h3 className="text-base font-bold text-white tracking-wide">{roomName}</h3>
        <p className="text-xs text-neutral-400 max-w-sm mt-1">
          High-definition room photography is being updated by hotel management.
        </p>
      </div>
    );
  }

  // Active clamped index
  const safeIndex = Math.min(activeIndex, totalImages - 1);
  const activeImage = normalizedImages[safeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. Main Large Hero Image */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/90 shadow-card group">
        <img
          src={activeImage.url}
          alt={activeImage.alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Fullscreen Expand Action */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label="Open fullscreen photo gallery"
          className="absolute top-3 right-3 p-2.5 rounded-xl bg-neutral-900/75 hover:bg-neutral-900 text-white backdrop-blur-md transition-all opacity-90 hover:opacity-100 shadow-md cursor-pointer"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Previous & Next Navigation Controls (only if > 1 image) */}
        {totalImages > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous room photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-dark backdrop-blur-md shadow-md transition-all hover:scale-105 cursor-pointer focus-visible:outline-brand"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next room photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-dark backdrop-blur-md shadow-md transition-all hover:scale-105 cursor-pointer focus-visible:outline-brand"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        {totalImages > 1 && (
          <div className="absolute bottom-3 right-3 bg-neutral-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            {safeIndex + 1} / {totalImages}
          </div>
        )}
      </div>

      {/* 2. Dynamic Thumbnail Strip (only for 2+ images) */}
      {totalImages > 1 && (
        <div
          className={`grid gap-2 sm:gap-3 ${
            totalImages === 2
              ? 'grid-cols-2'
              : totalImages === 3
              ? 'grid-cols-3'
              : totalImages === 4
              ? 'grid-cols-4'
              : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6'
          }`}
        >
          {normalizedImages.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View ${roomName} photo ${idx + 1}`}
              className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                safeIndex === idx
                  ? 'border-brand shadow-sm ring-2 ring-brand/30 scale-[1.02]'
                  : 'border-transparent opacity-70 hover:opacity-100 hover:scale-[1.01]'
              }`}
            >
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. Fullscreen Lightbox Modal */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={normalizedImages}
        currentIndex={safeIndex}
        onIndexChange={setActiveIndex}
      />
    </div>
  );
};
