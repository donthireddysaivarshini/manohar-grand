import React, { useState, useEffect } from 'react';
import { Images, Eye, Image as ImageIcon } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LightboxModal, LightboxImageItem } from '../../components/common/LightboxModal';
import { cmsApiService } from '../../services/api/cmsApiService';
import { ApiGalleryMedia } from '../../types/cms';

export const GalleryPage: React.FC = () => {
  const [mediaList, setMediaList] = useState<ApiGalleryMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    document.title = 'Photo Gallery | Manohar Grand Hotel';
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const data = await cmsApiService.getGallery();
        setMediaList(data);
      } catch (err) {
        console.error('Failed to load gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  // Derive unique categories dynamically
  const categories = ['all', ...Array.from(new Set(mediaList.map((item) => item.category)))];

  const filteredMedia = activeCategory === 'all'
    ? mediaList
    : mediaList.filter((img) => img.category === activeCategory);

  const lightboxImages: LightboxImageItem[] = filteredMedia.map((m) => ({
    id: m.id,
    url: m.image_url,
    alt: m.alt_text || m.title,
    caption: m.caption || m.title,
  }));

  const handleOpenLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <Section variant="dark" padding="md" className="border-b border-neutral-800">
        <Container size="xl">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="md" className="gap-1.5">
              <Images className="w-3.5 h-3.5" />
              Visual Experience
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Photo Gallery
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Browse authentic photographs of our guest accommodations, hotel facilities, and welcoming ambience.
            </p>
          </div>
        </Container>
      </Section>

      {/* Gallery Content */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          {/* Filter Pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className="font-semibold capitalize text-xs"
                >
                  {cat === 'all' ? `All Images (${mediaList.length})` : cat}
                </Button>
              ))}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="aspect-[4/3] rounded-2xl bg-neutral-100 animate-pulse" />
              ))}
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-200">
              <ImageIcon className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-dark">No photographs available in this category</p>
              <p className="text-xs text-neutral-secondary mt-1">Please select another category or check back soon.</p>
            </div>
          ) : (
            /* Responsive Gallery Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMedia.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => handleOpenLightbox(idx)}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer shadow-card border border-neutral-200 hover:shadow-card-hover transition-all"
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || img.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-neutral-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 text-white">
                    <div className="self-end p-2 rounded-full bg-white/20 backdrop-blur-sm">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand text-white inline-block mb-1">
                        {img.category}
                      </span>
                      <p className="text-xs font-bold leading-tight">{img.caption || img.title}</p>
                      <span className="text-[10px] text-neutral-300 block mt-0.5">
                        Click to view full-size
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>

        {/* Fullscreen Lightbox Modal */}
        <LightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={lightboxImages}
          currentIndex={activeImageIndex}
          onIndexChange={setActiveImageIndex}
        />
      </Section>
    </div>
  );
};
