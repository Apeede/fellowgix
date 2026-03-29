import { attendanceService } from '@services/firebase/attendance-service';
import { eventService } from '@services/firebase/event-service';
import { guestService } from '@services/firebase/guest-service';
import { Event } from '@types/event';
import { ArrowLeft, Check, Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface CheckInResult {
  success: boolean;
  isDuplicate: boolean;
  message: string;
  isReturningGuest: boolean;
  visitCount: number;
}

const GuestCheckInPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'non_rotaractor' as 'rotarian' | 'rotaractor' | 'non_rotaractor',
    club: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [eventClub, setEventClub] = useState({
    clubId: '',
    clubName: '',
    clubType: 'rotaract' as 'rotary' | 'rotaract',
    clubCode: '',
  });

  useEffect(() => {
    const loadEventClub = async () => {
      if (!eventId) return;
      try {
        const stateEvent = (location.state as { event?: Event } | null)?.event ?? null;
        const event = stateEvent && stateEvent.id === eventId
          ? stateEvent
          : await eventService.getEventById(eventId);
        setEventClub({
          clubId: event?.clubId || '',
          clubName: event?.clubName || '',
          clubType: event?.clubType === 'rotary' ? 'rotary' : 'rotaract',
          clubCode: event?.clubCode || '',
        });
      } catch (error) {
        setEventClub({
          clubId: '',
          clubName: '',
          clubType: 'rotaract',
          clubCode: '',
        });
      }
    };
    loadEventClub();
  }, [eventId, location.state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Valid email required';
    }

    if ((formData.type === 'rotarian' || formData.type === 'rotaractor') && !formData.club) {
      newErrors.club = 'Club is required for this type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!eventId) {
      toast.error('Event not found');
      return;
    }

    if (!eventClub.clubId) {
      toast.error('Event club information is missing');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check in guest (creates if new, updates if returning)
      const guestData = await guestService.checkInGuest(formData, eventClub.clubId, {
        clubName: eventClub.clubName,
        clubType: eventClub.clubType,
        clubCode: eventClub.clubCode,
      });

      // Record attendance
      const result = await attendanceService.recordAttendance(
        eventId,
        'guest',
        guestData.guest.id,
        guestData.guest.name,
        guestData.guest.email,
        guestData.guest.phone,
        eventClub.clubId,
        { isReturningGuest: guestData.isReturningGuest }
      );

      setCheckInResult({
        ...result,
        isReturningGuest: guestData.isReturningGuest,
        visitCount: guestData.visitCount,
      });

      if (result.isDuplicate) {
        toast.error(result.message);
      } else if (result.success) {
        toast.success(result.message);
        // Redirect to e-card page after successful check-in
        setTimeout(() => {
          navigate(`/events/${eventId}/ecard`, {
            replace: true,
            state: {
              eventId,
              attendeeName: formData.name,
              attendeeEmail: formData.email,
              attendeePhone: formData.phone,
              type: 'guest',
              club: formData.club,
            },
          });
        }, 1000);
      }
    } catch (error) {
      toast.error((error instanceof Error ? error.message : String(error)) || 'Check-in failed');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Guest Check-In</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success State */}
        {checkInResult?.success && (
          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center py-12">
            <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Check-In Successful!
            </h2>
            <p className="text-green-700 text-lg mb-2">Welcome {formData.name}!</p>
            {checkInResult.isReturningGuest && (
              <p className="text-green-600">
                Welcome back! This is your visit #{checkInResult.visitCount}
              </p>
            )}
            <p className="text-sm text-green-600 mt-4">
              Redirecting back to scanner...
            </p>
          </div>
        )}

        {/* Form State */}
        {!checkInResult && (
          <div className="card">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Guest Information</h2>
              <p className="text-gray-600">Please fill in your details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="guest-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="guest-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="guest-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="guest-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="guest-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="guest-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Guest Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliation <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-field"
                  disabled={isSubmitting}
                >
                  <option value="non_rotaractor">Non-Rotaractor</option>
                  <option value="rotaractor">Rotaractor</option>
                  <option value="rotarian">Rotarian</option>
                </select>
              </div>

              {/* Club (conditional) */}
              {(formData.type === 'rotarian' || formData.type === 'rotaractor') && (
                <div>
                  <label htmlFor="club" className="block text-sm font-medium text-gray-700 mb-2">
                    Club Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="club"
                    type="text"
                    name="club"
                    value={formData.club}
                    onChange={handleChange}
                    placeholder="Your club name"
                    className={`input-field ${errors.club ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.club && <p className="text-sm text-red-500 mt-1">{errors.club}</p>}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Checking In...' : 'Check In'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default GuestCheckInPage;
