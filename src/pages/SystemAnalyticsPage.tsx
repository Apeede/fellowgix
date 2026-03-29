import { useAuth } from '@context/useAuth';
import { AnalyticsService, SystemAnalyticsSummary } from '@services/firebase/analytics-service';
import { ArrowLeft, BarChart3, Loader } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';

const SystemAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAdmin } = useAuth();
  const [analytics, setAnalytics] = useState<SystemAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [clubTypeFilter, setClubTypeFilter] = useState<'all' | 'rotary' | 'rotaract'>('all');

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AnalyticsService.getSystemAnalytics({
        from: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined,
        to: toDate ? new Date(`${toDate}T23:59:59`) : undefined,
      });
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load system analytics');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    if (currentAdmin?.role === 'super_admin') {
      loadAnalytics();
    }
  }, [currentAdmin?.role, loadAnalytics]);

  const filteredClubRows = useMemo(() => {
    if (!analytics) return [];
    return clubTypeFilter === 'all'
      ? analytics.clubRows
      : analytics.clubRows.filter((club) => club.clubType === clubTypeFilter);
  }, [analytics, clubTypeFilter]);

  if (!currentAdmin || currentAdmin.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/super-admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
                <p className="text-sm text-gray-600">Platform-wide Rotary vs Rotaract comparison</p>
              </div>
            </div>
            <div className="flex gap-3">
              <input className="input-field" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input className="input-field" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isLoading ? (
          <div className="card text-center py-12">
            <Loader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading system analytics...</p>
          </div>
        ) : !analytics ? (
          <div className="card text-center py-12 text-gray-600">No system analytics available.</div>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card bg-blue-50"><p className="text-xs text-gray-600">Clubs</p><p className="text-2xl font-bold">{analytics.totalClubs}</p></div>
              <div className="card bg-indigo-50"><p className="text-xs text-gray-600">Admins</p><p className="text-2xl font-bold">{analytics.totalAdmins}</p></div>
              <div className="card bg-purple-50"><p className="text-xs text-gray-600">Events</p><p className="text-2xl font-bold">{analytics.totalEvents}</p></div>
              <div className="card bg-orange-50"><p className="text-xs text-gray-600">Attendance</p><p className="text-2xl font-bold">{analytics.totalAttendance}</p></div>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
              {analytics.performanceByType.map((row) => (
                <div key={row.clubType} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{row.clubType === 'rotary' ? 'Rotary Clubs' : 'Rotaract Clubs'}</h2>
                      <p className="text-sm text-gray-600">System-wide performance snapshot</p>
                    </div>
                    <BarChart3 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-500">Clubs</p><p className="font-semibold text-gray-900">{row.clubCount}</p></div>
                    <div><p className="text-gray-500">Admins</p><p className="font-semibold text-gray-900">{row.adminCount}</p></div>
                    <div><p className="text-gray-500">Events</p><p className="font-semibold text-gray-900">{row.eventCount}</p></div>
                    <div><p className="text-gray-500">Attendance</p><p className="font-semibold text-gray-900">{row.totalAttendance}</p></div>
                    <div><p className="text-gray-500">Unique Attendees</p><p className="font-semibold text-gray-900">{row.uniqueAttendees}</p></div>
                    <div><p className="text-gray-500">Avg/Event</p><p className="font-semibold text-gray-900">{row.avgAttendancePerEvent.toFixed(1)}</p></div>
                  </div>
                </div>
              ))}
            </section>

            <section className="card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Club Performance Table</h2>
                <select
                  className="input-field max-w-xs"
                  value={clubTypeFilter}
                  onChange={(e) => setClubTypeFilter(e.target.value as 'all' | 'rotary' | 'rotaract')}
                >
                  <option value="all">All Club Types</option>
                  <option value="rotary">Rotary</option>
                  <option value="rotaract">Rotaract</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Club</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Admins</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Events</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Attendance</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unique</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Avg/Event</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClubRows.map((club) => (
                      <tr key={club.clubId}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <p className="font-medium">{club.clubName}</p>
                          <p className="text-xs text-gray-500">{club.clubId}{club.clubCode ? ` • ${club.clubCode}` : ''}</p>
                        </td>
                        <td className="px-4 py-3 text-sm uppercase text-gray-700">{club.clubType}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{club.adminCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{club.eventCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{club.totalAttendance}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{club.uniqueAttendees}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{club.avgAttendancePerEvent.toFixed(1)}</td>
                      </tr>
                    ))}
                    {filteredClubRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-600">No clubs found for this filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default SystemAnalyticsPage;
