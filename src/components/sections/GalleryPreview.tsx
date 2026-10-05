import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Images, ArrowRight, Eye } from 'lucide-react';
import { Container } from '../common/Container';
import { Section } from '../common/Section';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { LightboxModal, LightboxImageItem } from '../common/LightboxModal';
import { cmsApiService } from '../../services/api/cmsApiService';
import { ApiGalleryMedia } from '../../types/cms';

export const GalleryPreview: React.FC = () => {
  const [galleryMedia, setGalleryMedia] = useState<ApiGalleryMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchPreviewGallery = async () => {
      try {
        setLoading(true);
        const data = await cmsApiService.getGallery();
        setGalleryMedia(data);
      } catch (err) {
        console.error('Failed to load gallery preview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreviewGallery();
  }, []);

  const previewImages = galleryMedia.slice(0, 4);

  const lightboxImages: LightboxImageItem[] = galleryMedia.map((m) => ({
    id: m.id,
    url: m.image_url,
    alt: m.alt_text || m.title,
    caption: m.caption || m.title,
  }));

  const handleImageClick = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  if (!loading && galleryMedia.length === 0) {
    return null;
  }

  return (
    <Section variant="white" padding="lg">
      <Container size="xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="flex flex-col items-start gap-2 max-w-xl">
            <Badge variant="brand" size="md" className="gap-1.5">
              <Images className="w-3.5 h-3.5" />
              Visual Experience
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-dark tracking-tight">
              A Glimpse of Manohar Grand
            </h2>
            <p className="text-sm text-neutral-secondary leading-relaxed">
              Explore our guest rooms, welcoming reception, and comfortable surroundings through our photo gallery.
            </p>
          </div>

          <Link to="/gallery" className="shrink-0">
            <Button variant="outline" size="md" className="gap-2 font-semibold">
              View Full Gallery
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Editorial Responsive Image Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="aspect-[4/3] rounded-2xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {previewImages.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => handleImageClick(idx)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer shadow-card border border-neutral-200 hover:shadow-card-hover transition-all"
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || img.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-neutral-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 text-white">
                  <div className="self-end p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{img.caption || img.title}</p>
                    <span className="text-[10px] text-neutral-300">Click to preview</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Accessible Lightbox Viewer */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={lightboxImages}
        currentIndex={activeImageIndex}
        onIndexChange={setActiveImageIndex}
      />
    </Section>
  );
};
