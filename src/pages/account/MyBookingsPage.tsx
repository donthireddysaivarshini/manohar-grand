import React from 'react';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { BookOpen } from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <Badge variant="brand" size="md" className="w-fit gap-1.5">
        <BookOpen className="w-3.5 h-3.5" />
        Reservation History
      </Badge>
      <h1 className="text-3xl font-extrabold text-neutral-dark">My Bookings</h1>
      <p className="text-sm text-neutral-secondary">
        List of active and past bookings will be implemented in <strong>Phase 6</strong>.
      </p>

      <Card variant="bordered" className="bg-white p-6 mt-4">
        <CardContent className="p-0 text-xs text-neutral-secondary">
          <p>• Connected with LocalStorage mock bookings engine.</p>
        </CardContent>
      </Card>
    </div>
  );
};
