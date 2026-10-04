import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  BookOpen,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { authService } from '../../lib/api';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    state: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Personal Profile | Manohar Grand Hotel';
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        city: user.customer_profile?.city || '',
        state: user.customer_profile?.state || '',
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Basic phone validation if provided
    const cleanPhone = form.phone.trim();
    if (cleanPhone && cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit contact phone number.');
      setIsSaving(false);
      return;
    }

    try {
      const updatedUser = await authService.updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: cleanPhone,
        city: form.city.trim(),
        state: form.state.trim(),
      });

      setUser(updatedUser);
      setSuccessMsg('Your profile and phone number have been updated successfully.');
    } catch (err: unknown) {
      const error = err as any;
      const errData = error.response?.data;
      let msg = 'Failed to update profile. Please try again.';
      if (typeof errData?.error === 'string') {
        msg = errData.error;
      } else if (errData?.error?.message) {
        msg = errData.error.message;
      } else if (errData?.message) {
        msg = errData.message;
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <Badge variant="brand" size="md" className="w-fit gap-1.5">
          <User className="w-3.5 h-3.5" />
          Customer Information
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark">Personal Profile</h1>
        <p className="text-xs sm:text-sm text-neutral-secondary">
          Update your contact details. Changes are instantly synchronized with hotel reception and admin records.
        </p>
      </div>

      <Card variant="bordered" className="bg-white p-6 sm:p-7 rounded-2xl border-neutral-border shadow-xs">
        <CardContent className="p-0 space-y-6">
          {/* Feedback Banners */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Read-Only Account Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Email Address (Verified)
                </span>
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-dark">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{user?.email || '—'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Account Type
                </span>
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-dark">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct Guest Member</span>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-dark">
                  First Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-dark focus:outline-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-dark">
                  Last Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-dark focus:outline-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-dark">
                  Contact Phone Number <span className="text-brand">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-dark focus:outline-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Used by reception for check-in verification and WhatsApp reservation vouchers.
                </p>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-dark">
                  City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-dark focus:outline-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-dark">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telangana"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-dark focus:outline-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSaving}
                className="gap-2 font-bold shadow-md text-xs h-10 px-5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Quick Shortcuts */}
          <div className="pt-5 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link to="/account/bookings" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full font-bold gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5" />
                <span>View All Reservations</span>
              </Button>
            </Link>

            <Link to="/booking" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full font-bold gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>Book New Stay</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
