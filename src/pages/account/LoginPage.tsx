import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Container } from '../../components/common/Container';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

import { extractErrorMessage } from '../../utils/errorUtils';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/account/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setError(null);
      setIsSubmitting(true);
      try {
        await loginWithGoogle(codeResponse.code);
        navigate('/account/dashboard', { replace: true });
      } catch (err: unknown) {
        setError(extractErrorMessage(err, 'Google sign-in failed. Please try again.'));
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/account/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Invalid email or password credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Access your direct reservations, booking confirmations, tax invoices, and stay history securely.
          </p>

          <Card variant="bordered" className="w-full bg-white p-7 mt-2 rounded-2xl shadow-sm border border-neutral-light text-left">
            <CardContent className="p-0 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-dark mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-dark placeholder:text-neutral-400 focus:outline-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-dark mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-dark placeholder:text-neutral-400 focus:outline-brand focus:ring-1 focus:ring-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || isLoading}
                  className="w-full font-bold shadow-md h-10 text-xs gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In to Account</span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-neutral-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Or
                </span>
              </div>

              {/* Google Sign-In Action */}
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isSubmitting || isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-dark font-semibold text-xs hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-neutral-secondary">
                  Don't have an account?{' '}
                  <Link to="/booking" className="text-brand font-bold hover:underline">
                    Book a room or create an account
                  </Link>
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-muted pt-2 border-t border-neutral-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted 256-bit secure session connection</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};
