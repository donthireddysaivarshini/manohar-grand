import React from 'react';
import {
  Wind,
  Users,
  BedDouble,
  Droplets,
  Tv,
  Car,
  Sparkles,
} from 'lucide-react';
import { ApiRoomCategory } from '../../types/booking';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';

export interface RoomSpecGridProps {
  category: ApiRoomCategory;
}

export const RoomSpecGrid: React.FC<RoomSpecGridProps> = ({ category }) => {
  const isAc =
    category.id === 'ac-room' ||
    category.slug === 'ac-room' ||
    category.name.toLowerCase().includes('ac') && !category.name.toLowerCase().includes('non-ac');

  const specs = [
    {
      label: 'Occupancy',
      value: `Up to ${category.included_adults || 2} Adults (Max ${category.max_total_occupancy || 2} Guests)`,
      icon: <Users className="w-5 h-5 text-brand" />,
      badge: 'Authoritative',
    },
    {
      label: 'Bedding & Mattress',
      value: 'WAKEFIT Memory Foam Mattress (Double Bed)',
      icon: <BedDouble className="w-5 h-5 text-brand" />,
      badge: 'Standard In All Rooms',
    },
    {
      label: 'Climate Control',
      value: isAc ? 'Individual Air Conditioning' : 'Ceiling Fan & Natural Airflow',
      icon: <Wind className="w-5 h-5 text-brand" />,
      badge: isAc ? 'Climate Controlled' : 'Ventilated',
    },
    {
      label: 'Smart TV & Media',
      value: '32" Smart TV (OTT Apps Supported)',
      icon: <Tv className="w-5 h-5 text-brand" />,
      badge: 'In-Room Entertainment',
    },
    {
      label: 'Attached Bathroom',
      value: 'Private Bathroom with 24/7 Hot & Cold Water',
      icon: <Droplets className="w-5 h-5 text-brand" />,
      badge: 'Private & Clean',
    },
    {
      label: 'Vehicle Parking',
      value: 'On-Property Car & Two-Wheeler Parking',
      icon: <Car className="w-5 h-5 text-brand" />,
      badge: 'Available',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {specs.map((spec, idx) => (
        <Card
          key={idx}
          variant="bordered"
          className="bg-neutral-50/80 p-4 border-neutral-200/90 hover:bg-white hover:border-neutral-300 transition-all rounded-xl shadow-2xs"
        >
          <CardContent className="p-0 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-xs">
              {spec.icon || <Sparkles className="w-5 h-5 text-brand" />}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                {spec.label}
              </span>
              <span className="text-xs sm:text-sm font-bold text-neutral-dark leading-snug">
                {spec.value}
              </span>
              <div>
                <Badge
                  variant="default"
                  size="sm"
                  className="text-[9px] py-0 px-1.5 mt-1 font-semibold text-neutral-600 bg-neutral-200/70"
                >
                  {spec.badge}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
