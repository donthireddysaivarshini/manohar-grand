import React, { useState, useEffect } from 'react';
import { Images, Eye, ShieldAlert } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LightboxModal } from '../../components/common/LightboxModal';
import { DEMO_MEDIA } from '../../data/demoMedia';

export const GalleryPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Photo Gallery | Manohar Grand Hotel';
  }, []);

  const [activeCategory, setActiveCategory] = useState<'all' | 'rooms' | 'exterior' | 'ambience'>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const filteredImages = activeCategory === 'all'
    ? DEMO_MEDIA.gallery
    : DEMO_MEDIA.gallery.filter((img) => img.category === activeCategory);

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
              Browse images of our guest accommodations, hotel surroundings, and welcoming ambience.
            </p>
          </div>
        </Container>
      </Section>

      {/* Gallery Content */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          {/* Transparency Disclaimer */}
          <div className="mb-8 p-4 rounded-lg bg-white border border-neutral-border shadow-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-feedback-warning shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-secondary">
              <span className="font-bold text-neutral-dark">Demo Imagery Notice: </span>
              All photographs below are temporary stock hospitality images selected for layout demonstration. They will be replaced with confirmed Manohar Grand photographs.
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <Button
              variant={activeCategory === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
              className="font-semibold"
            >
              All Images ({DEMO_MEDIA.gallery.length})
            </Button>
            <Button
              variant={activeCategory === 'rooms' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('rooms')}
              className="font-semibold"
            >
              Rooms
            </Button>
            <Button
              variant={activeCategory === 'exterior' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('exterior')}
              className="font-semibold"
            >
              Exterior
            </Button>
            <Button
              variant={activeCategory === 'ambience' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('ambience')}
              className="font-semibold"
            >
              Ambience
            </Button>
          </div>

          {/* Responsive Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => handleOpenLightbox(idx)}
                className="group relative aspect-[4/3] rounded-card overflow-hidden bg-neutral-100 cursor-pointer shadow-card border border-neutral-border hover:shadow-card-hover transition-all"
              >
                <img
                  src={img.url}
                  alt={img.alt}
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
                    <p className="text-xs font-bold leading-tight">{img.caption}</p>
                    <span className="text-[10px] text-neutral-300 block mt-0.5">
                      Click to view full-size
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>

        {/* Fullscreen Lightbox Modal */}
        <LightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={filteredImages}
          currentIndex={activeImageIndex}
          onIndexChange={setActiveImageIndex}
        />
      </Section>
    </div>
  );
};
