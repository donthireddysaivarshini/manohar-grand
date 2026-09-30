import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Container } from '../../components/common/Container';
import { Loader2, AlertCircle } from 'lucide-react';

export const AuthCallbackPage: React.FC = () => {
  const { hydrate } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const completeAuthentication = async () => {
      try {
        const user = await hydrate();
        if (isMounted) {
          if (user) {
            // Completed hydration from Django session
            setTimeout(() => {
              navigate('/account/dashboard', { replace: true });
            }, 500);
          } else {
            setError('Authentication session could not be verified. Please try signing in again.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'An error occurred during authentication completion.');
        }
      }
    };

    completeAuthentication();

    return () => {
      isMounted = false;
    };
  }, [hydrate, navigate]);

  return (
    <div className="py-20 flex-1 flex items-center justify-center min-h-[60vh]">
      <Container size="sm">
        <div className="text-center flex flex-col items-center gap-4 bg-white p-8 rounded-2xl border border-neutral-light shadow-sm">
          {!error ? (
            <>
              <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
              <h2 className="text-xl font-bold text-neutral-dark">Completing Sign In...</h2>
              <p className="text-sm text-neutral-secondary">
                Verifying your authenticated session with Manohar Grand Hotel.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-10 h-10 text-red-500" />
              <h2 className="text-xl font-bold text-neutral-dark">Authentication Notice</h2>
              <p className="text-sm text-neutral-secondary">{error}</p>
              <button
                onClick={() => navigate('/account/login')}
                className="mt-4 px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary-dark transition-colors"
              >
                Return to Login
              </button>
            </>
          )}
        </div>
      </Container>
    </div>
  );
};
