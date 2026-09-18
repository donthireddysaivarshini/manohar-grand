import React from 'react';
import { Container } from '../../components/common/Container';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="py-12 flex-1">
      <Container size="sm">
        <div className="text-center flex flex-col items-center gap-4">
          <Badge variant="brand" size="md" className="gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Customer Account
          </Badge>
          <h1 className="text-2xl font-extrabold text-neutral-dark">
            Customer Sign In
          </h1>
          <p className="text-sm text-neutral-secondary">
            Mock authentication login flow will be implemented in <strong>Phase 6</strong>.
          </p>

          <Card variant="bordered" className="w-full bg-white p-6 mt-4 text-left">
            <CardContent className="p-0 text-xs text-neutral-secondary">
              <p>• Passwordless/mock login simulation</p>
              <p>• Session state managed via AuthContext</p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};
