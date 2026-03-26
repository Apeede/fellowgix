import { AnalyticsService, AttendanceListItem } from '@services/firebase/analytics-service';
import { eventService } from '@services/firebase/event-service';
import {
    AlertCircle,
    ArrowLeft,
    Download,
    Filter,
    Loader,
    Search,
    User as UserIcon,
    Users,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

type FilterType = 'all' | 'member' | 'guest' | 'duplicate';

const AttendanceListPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [eventName, setEventName] = useState('');
  const [attendees, setAttendees] = useState<AttendanceListItem[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<AttendanceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId, loadData]);

  useEffect(() => {
    applyFilters();
  }, [attendees, searchTerm, filterType, applyFilters]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load event details
      const event = await eventService.getEventById(eventId!);
      if (!event) {
        toast.error('Event not found');
        navigate('/events', { replace: true });
        return;
      }
      setEventName(event.name);

      // Load attendance list
      const list = await AnalyticsService.getEventAttendanceList(eventId!);
      setAttendees(list);
    } catch (error) {
      toast.error('Failed to load attendance data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, navigate]);

  const applyFilters = useCallback(() => {
    let filtered = attendees;

    // Filter by type
    if (filterType === 'member') {
      filtered = filtered.filter((a) => a.type === 'member');
    } else if (filterType === 'guest') {
      filtered = filtered.filter((a) => a.type === 'guest');
    } else if (filterType === 'duplicate') {
      filtered = filtered.filter((a) => a.isDuplicate);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.personName.toLowerCase().includes(term) ||
          a.email.toLowerCase().includes(term) ||
          a.phone.includes(term)
      );
    }

    setFilteredAttendees(filtered);
  }, [attendees, searchTerm, filterType]);

  const handleExport = async () => {
    if (!eventId) return;

    setIsExporting(true);
    try {
      await AnalyticsService.exportAttendanceAsCSV(eventId, eventName);
      toast.success('Attendance list exported!');
    } catch (error) {
      toast.error('Failed to export attendance list');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Attendance List</h1>
                <p className="text-gray-600 mt-1">{eventName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading || isExporting || attendees.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {isExporting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-16">
            <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading attendance data...</p>
          </div>
        ) : attendees.length === 0 ? (
          <div className="card text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">No attendees yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Check-ins will appear here as people scan the QR code
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-sm font-medium text-gray-600">Total</div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{attendees.length}</p>
              </div>
              <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="text-sm font-medium text-gray-600">Members</div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {attendees.filter((a) => a.type === 'member').length}
                </p>
              </div>
              <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-sm font-medium text-gray-600">Guests</div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {attendees.filter((a) => a.type === 'guest').length}
                </p>
              </div>
              <div className="card bg-gradient-to-br from-orange-50 to-red-50">
                <div className="text-sm font-medium text-gray-600">Duplicates</div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {attendees.filter((a) => a.isDuplicate).length}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="card space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <label htmlFor="attendance-search" className="sr-only">Search attendees</label>
                    <input
                      id="attendance-search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <label htmlFor="filter-type" className="sr-only">Filter by type</label>
                  <select
                    id="filter-type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                    className="input-field"
                  >
                    <option value="all">All Types</option>
                    <option value="member">Members Only</option>
                    <option value="guest">Guests Only</option>
                    <option value="duplicate">Duplicates Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Info */}
            <div className="text-sm text-gray-600">
              Showing {filteredAttendees.length} of {attendees.length} attendees
            </div>

            {/* Attendance Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Check-in Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAttendees.map((attendee) => (
                      <tr key={attendee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {attendee.personName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attendee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attendee.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              attendee.type === 'member'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {attendee.type === 'member' ? '👤 Member' : '🌟 Guest'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attendee.checkedInAt.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attendee.isDuplicate ? (
                            <div className="flex items-center gap-1 text-yellow-700 text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              Duplicate
                            </div>
                          ) : (
                            <span className="text-green-600 font-medium text-sm">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredAttendees.length === 0 && attendees.length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No attendees match the current filters</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AttendanceListPage;
