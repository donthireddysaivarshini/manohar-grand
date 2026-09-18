import React from 'react';
import { Badge } from '../../components/common/Badge';
import { User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <Badge variant="brand" size="md" className="w-fit gap-1.5">
        <User className="w-3.5 h-3.5" />
        Guest Profile
      </Badge>
      <h1 className="text-3xl font-extrabold text-neutral-dark">Customer Profile</h1>
      <p className="text-sm text-neutral-secondary">
        Profile management and contact details will be built in <strong>Phase 6</strong>.
      </p>
    </div>
  );
};
