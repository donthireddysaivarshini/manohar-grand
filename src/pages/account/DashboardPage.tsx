import React from 'react';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { LayoutDashboard } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <Badge variant="brand" size="md" className="w-fit gap-1.5">
        <LayoutDashboard className="w-3.5 h-3.5" />
        Customer Portal
      </Badge>
      <h1 className="text-3xl font-extrabold text-neutral-dark">My Account Dashboard</h1>
      <p className="text-sm text-neutral-secondary">
        Overview of recent reservations and account preferences will be built in <strong>Phase 6</strong>.
      </p>

      <Card variant="bordered" className="bg-white p-6 mt-4">
        <CardContent className="p-0 text-xs text-neutral-secondary">
          <p>• Quick access to upcoming reservations</p>
          <p>• Fast room rebooking shortcuts</p>
        </CardContent>
      </Card>
    </div>
  );
};
