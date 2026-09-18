import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/common/Container';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 flex-1 flex items-center justify-center">
      <Container size="md">
        <div className="text-center flex flex-col items-center gap-5 max-w-md mx-auto">
          <Badge variant="error" size="md">
            404 — Page Not Found
          </Badge>
          <h1 className="text-4xl font-extrabold text-neutral-dark">
            Looking for a room?
          </h1>
          <p className="text-sm text-neutral-secondary leading-relaxed">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button variant="primary" size="md" className="gap-2">
              <Home className="w-4 h-4" />
              Return to Homepage
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
};
