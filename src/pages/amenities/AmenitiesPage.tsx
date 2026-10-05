import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Section } from '../../components/common/Section';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { Icon3D } from '../../components/common/Icon3D';
import { ScrollReveal } from '../../components/common/ScrollReveal';
import { cmsApiService } from '../../services/api/cmsApiService';
import { ApiAmenityItem } from '../../types/cms';

export const AmenitiesPage: React.FC = () => {
  const [amenities, setAmenities] = useState<ApiAmenityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = 'Hotel Amenities & Services | Manohar Grand';
    const loadAmenities = async () => {
      try {
        setLoading(true);
        const data = await cmsApiService.getAmenities();
        setAmenities(data);
      } catch (err) {
        console.error('Failed to load amenities:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAmenities();
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <Section variant="dark" padding="md" className="border-b border-neutral-800">
        <Container size="xl">
          <div className="max-w-2xl flex flex-col items-start gap-3">
            <Badge variant="brand" size="md">
              Hotel Facilities
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Amenities &amp; Guest Services
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Convenient comforts, on-site parking, round-the-clock reception, and clean accommodations designed for a restful stay.
            </p>
          </div>
        </Container>
      </Section>

      {/* Main Amenities Grid */}
      <Section variant="default" padding="lg">
        <Container size="xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="h-48 bg-neutral-100 rounded-2xl animate-pulse p-6" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {amenities.map((item, index) => (
                <ScrollReveal
                  key={item.id || index}
                  direction="up"
                  delayMs={index * 50}
                  className="h-full"
                >
                  <Card
                    variant="default"
                    className="h-full bg-white border border-neutral-200/90 rounded-2xl p-6 flex flex-col justify-between gap-4 hover:border-brand/30 transition-all hover:-translate-y-1 hover:shadow-card-hover"
                  >
                    <CardContent className="p-0 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <Icon3D name={item.icon_name || 'comfortable-stay'} size="lg" className="shadow-sm" />
                        {item.is_property_wide ? (
                          <span className="text-[10px] uppercase font-bold text-feedback-success bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                            Property-Wide
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-full border border-brand/20">
                            Room Amenity
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-neutral-dark">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-secondary leading-relaxed">
                          {item.description || 'Quality amenity provided for your comfort and convenience.'}
                        </p>
                      </div>
                    </CardContent>

                    <div className="pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                      <span>Included with your stay</span>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Direct Booking CTA Bar */}
          <ScrollReveal direction="up" className="mt-12 p-8 rounded-2xl bg-white border border-neutral-200 shadow-card text-center flex flex-col items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black text-neutral-dark">
              Plan Your Stay at Manohar Grand
            </h3>
            <p className="text-xs sm:text-sm text-neutral-secondary max-w-md">
              Enjoy AC and Non-AC room choices with direct reservation guarantees and dedicated reception support.
            </p>
            <Link to="/booking">
              <Button variant="primary" size="lg" className="gap-2 font-bold shadow-md">
                <CalendarDays className="w-4 h-4" />
                Book Your Stay Online
              </Button>
            </Link>
          </ScrollReveal>
        </Container>
      </Section>
    </div>
  );
};
