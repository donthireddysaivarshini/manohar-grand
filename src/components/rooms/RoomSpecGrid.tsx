import React from 'react';
import {
  Wind,
  Layers,
  Users,
  BedDouble,
  Maximize2,
  Droplets,
  Sparkles,
} from 'lucide-react';
import { RoomDetailedSpecification } from '../../data/roomCategories';
import { Card, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';

const SPEC_ICONS: Record<string, React.ReactNode> = {
  Wind: <Wind className="w-5 h-5 text-brand" />,
  Layers: <Layers className="w-5 h-5 text-brand" />,
  Users: <Users className="w-5 h-5 text-brand" />,
  BedDouble: <BedDouble className="w-5 h-5 text-brand" />,
  Maximize2: <Maximize2 className="w-5 h-5 text-brand" />,
  Droplets: <Droplets className="w-5 h-5 text-brand" />,
};

export interface RoomSpecGridProps {
  specifications: RoomDetailedSpecification[];
}

export const RoomSpecGrid: React.FC<RoomSpecGridProps> = ({ specifications }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {specifications.map((spec, idx) => (
        <Card
          key={idx}
          variant="bordered"
          className="bg-neutral-light/60 p-4 border-neutral-border/80 hover:bg-white hover:border-neutral-border transition-all"
        >
          <CardContent className="p-0 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-neutral-border flex items-center justify-center shrink-0 shadow-xs">
              {SPEC_ICONS[spec.iconName] || <Sparkles className="w-5 h-5 text-brand" />}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-neutral-secondary uppercase tracking-wider">
                {spec.label}
              </span>
              <span className="text-xs sm:text-sm font-bold text-neutral-dark">
                {spec.value}
              </span>
              <div>
                <Badge
                  variant={spec.isDemo ? 'default' : 'success'}
                  size="sm"
                  className="text-[9px] py-0 px-1.5 mt-1 font-bold"
                >
                  {spec.isDemo ? 'Demo Specification' : 'Confirmed Inventory'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
