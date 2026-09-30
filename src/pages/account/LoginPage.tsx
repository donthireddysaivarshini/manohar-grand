import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/account/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="py-16 flex-1 flex items-center justify-center min-h-[70vh]">
      <Container size="sm">
        <div className="text-center flex flex-col items-center gap-5">
          <Badge variant="brand" size="md" className="gap-1.5 px-3 py-1">
            <Lock className="w-3.5 h-3.5" />
            Direct Booking Guest Portal
          </Badge>

          <h1 className="text-3xl font-extrabold text-neutral-dark tracking-tight">
            Sign In to Manohar Grand
          </h1>
          <p className="text-sm text-neutral-secondary max-w-md">
            Access your direct reservations, booking confirmations, tax invoices, and self-service cancellations securely.
          </p>

          <Card variant="bordered" className="w-full bg-white p-8 mt-2 rounded-2xl shadow-sm border border-neutral-light">
            <CardContent className="p-0 flex flex-col items-center gap-6">
              {/* Google Sign-In Action */}
              <button
                onClick={loginWithGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-neutral-medium rounded-xl text-neutral-dark font-semibold text-sm hover:bg-neutral-light hover:border-neutral-dark transition-all duration-200 shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-2 text-xs text-neutral-muted">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted 256-bit secure session connection</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};
