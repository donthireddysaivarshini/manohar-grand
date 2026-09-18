import React from 'react';
import { Container } from '../../components/common/Container';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { UserPlus } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="py-12 flex-1">
      <Container size="sm">
        <div className="text-center flex flex-col items-center gap-4">
          <Badge variant="brand" size="md" className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            New Account
          </Badge>
          <h1 className="text-2xl font-extrabold text-neutral-dark">
            Create Customer Account
          </h1>
          <p className="text-sm text-neutral-secondary">
            Customer registration UI will be implemented in <strong>Phase 6</strong>.
          </p>

          <Card variant="bordered" className="w-full bg-white p-6 mt-4 text-left">
            <CardContent className="p-0 text-xs text-neutral-secondary">
              <p>• Clean input validation for name, email, and phone</p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};
