import { useAuth } from '@context/useAuth';
import { eventService } from '@services/firebase/event-service';
import { AlertCircle, ArrowLeft, Loader, Save } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const EditEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { currentAdmin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    theme: '',
    speaker: '',
    location: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canManageEvents = useMemo(
    () =>
      currentAdmin?.role === 'event_manager' ||
      currentAdmin?.role === 'club_admin' ||
      currentAdmin?.role === 'super_admin',
    [currentAdmin?.role]
  );

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId || !currentAdmin) return;

      try {
        const event = await eventService.getEventById(eventId);
        if (!event) {
          toast.error('Event not found');
          navigate('/events');
          return;
        }

        if (
          event.clubId &&
          currentAdmin.clubId &&
          event.clubId !== currentAdmin.clubId &&
          currentAdmin.role !== 'super_admin'
        ) {
          toast.error('You do not have access to edit this event');
          navigate('/events');
          return;
        }

        setFormData({
          name: event.name || '',
          date: event.date || '',
          time: event.time || '',
          theme: event.theme || '',
          speaker: event.speaker || '',
          location: event.location || '',
          description: event.description || '',
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load event');
        navigate('/events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [currentAdmin, eventId, navigate]);

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Event name is required';
    if (!formData.date) nextErrors.date = 'Event date is required';
    if (!formData.theme.trim()) nextErrors.theme = 'Event theme is required';
    if (!formData.speaker.trim()) nextErrors.speaker = 'Speaker name is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventId) return;
    if (!canManageEvents) {
      toast.error('Your role cannot edit events');
      return;
    }
    if (!validateForm()) {
      toast.error('Please fix validation errors first');
      return;
    }

    setIsSaving(true);
    try {
      await eventService.updateEvent(eventId, {
        name: formData.name.trim(),
        date: formData.date,
        time: formData.time,
        theme: formData.theme.trim(),
        speaker: formData.speaker.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
      });
      toast.success('Event updated successfully');
      navigate('/events');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/events')}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Event</h1>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="card py-12 text-center">
            <Loader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading event...</p>
          </div>
        ) : (
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={`input-field ${errors.date ? 'border-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">Event Time</label>
                  <input
                    id="time"
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="input-field"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                    Theme <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="theme"
                    type="text"
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    className={`input-field ${errors.theme ? 'border-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {errors.theme && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.theme}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="speaker" className="block text-sm font-medium text-gray-700 mb-2">
                    Speaker <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="speaker"
                    type="text"
                    name="speaker"
                    value={formData.speaker}
                    onChange={handleChange}
                    className={`input-field ${errors.speaker ? 'border-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {errors.speaker && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.speaker}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field resize-none"
                  disabled={isSaving}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/events')}
                  disabled={isSaving}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !canManageEvents}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditEventPage;
