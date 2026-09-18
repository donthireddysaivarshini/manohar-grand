import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { ArrowLeft } from 'lucide-react';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/account/bookings"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-secondary hover:text-neutral-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all bookings
      </Link>
      <Badge variant="brand" size="md" className="w-fit">
        Booking #{id || 'DETAILS'}
      </Badge>
      <h1 className="text-3xl font-extrabold text-neutral-dark">Reservation Details</h1>
      <p className="text-sm text-neutral-secondary">
        Comprehensive booking record with cancellation and receipt actions will be built in <strong>Phase 6</strong>.
      </p>
    </div>
  );
};
