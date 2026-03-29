import { useAuth } from '@context/useAuth';
import { AnalyticsService, ClubAnalyticsSummary, RepresentedClubType } from '@services/firebase/analytics-service';
import { ArrowLeft, Download, Loader } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ClubAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAdmin } = useAuth();
  const [analytics, setAnalytics] = useState<ClubAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [comparisonFilter, setComparisonFilter] = useState<'all' | RepresentedClubType>('all');

  const loadAnalytics = useCallback(async () => {
    if (!currentAdmin?.clubId) return;
    setIsLoading(true);
    try {
      const data = await AnalyticsService.getClubAnalytics(currentAdmin.clubId, {
        from: fromDate ? new Date(`${fromDate}T00:00:00`) : undefined,
        to: toDate ? new Date(`${toDate}T23:59:59`) : undefined,
      });
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load club analytics');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAdmin?.clubId, fromDate, toDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (!currentAdmin) {
    return null;
  }

  const filteredClubComparison =
    comparisonFilter === 'all'
      ? analytics?.clubComparison || []
      : (analytics?.clubComparison || []).filter((entry) => entry.clubType === comparisonFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Club Analytics</h1>
                <p className="text-sm text-gray-600">{currentAdmin.clubName}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-outline flex items-center gap-2"
              onClick={() => {
                if (!analytics) return;
                AnalyticsService.exportClubAnalyticsAsCSV(currentAdmin.clubName, analytics);
              }}
              disabled={!analytics}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input-field" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <input className="input-field" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <button type="button" className="btn-outline" onClick={() => { setFromDate(''); setToDate(''); }}>
              Clear Filter
            </button>
          </div>
        </section>

        {isLoading ? (
          <div className="card text-center py-12">
            <Loader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading club analytics...</p>
          </div>
        ) : !analytics ? (
          <div className="card text-center py-12 text-gray-600">No analytics available.</div>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="card bg-blue-50"><p className="text-xs text-gray-600">Events</p><p className="text-2xl font-bold">{analytics.totalEvents}</p></div>
              <div className="card bg-green-50"><p className="text-xs text-gray-600">Active Events</p><p className="text-2xl font-bold">{analytics.activeEvents}</p></div>
              <div className="card bg-purple-50"><p className="text-xs text-gray-600">Total Attendance</p><p className="text-2xl font-bold">{analytics.totalAttendance}</p></div>
              <div className="card bg-indigo-50"><p className="text-xs text-gray-600">Unique</p><p className="text-2xl font-bold">{analytics.uniqueAttendees}</p></div>
              <div className="card bg-orange-50"><p className="text-xs text-gray-600">Members</p><p className="text-2xl font-bold">{analytics.memberCount}</p></div>
              <div className="card bg-pink-50"><p className="text-xs text-gray-600">Guests</p><p className="text-2xl font-bold">{analytics.guestCount}</p></div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card bg-sky-50"><p className="text-xs text-gray-600">Rotary Reach</p><p className="text-2xl font-bold">{analytics.clubTypeBreakdown.rotary}</p></div>
              <div className="card bg-emerald-50"><p className="text-xs text-gray-600">Rotaract Reach</p><p className="text-2xl font-bold">{analytics.clubTypeBreakdown.rotaract}</p></div>
              <div className="card bg-violet-50"><p className="text-xs text-gray-600">Member Club Reach</p><p className="text-2xl font-bold">{analytics.clubTypeBreakdown.member}</p></div>
              <div className="card bg-slate-100"><p className="text-xs text-gray-600">Unknown Reach</p><p className="text-2xl font-bold">{analytics.clubTypeBreakdown.unknown}</p></div>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Guest Type Mix</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-gray-600">Rotarians</span><span className="font-semibold text-gray-900">{analytics.guestTypeBreakdown.rotarian}</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-600">Rotaractors</span><span className="font-semibold text-gray-900">{analytics.guestTypeBreakdown.rotaractor}</span></div>
                  <div className="flex items-center justify-between"><span className="text-gray-600">Non-Rotaractors</span><span className="font-semibold text-gray-900">{analytics.guestTypeBreakdown.non_rotaractor}</span></div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Cross-Club Reach</h2>
                  <select
                    className="input-field max-w-xs"
                    value={comparisonFilter}
                    onChange={(e) => setComparisonFilter(e.target.value as 'all' | RepresentedClubType)}
                  >
                    <option value="all">All Club Types</option>
                    <option value="rotary">Rotary</option>
                    <option value="rotaract">Rotaract</option>
                    <option value="member">Member Clubs</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {filteredClubComparison.slice(0, 12).map((entry) => (
                    <div key={`${entry.clubType}-${entry.club}`} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm text-gray-900">{entry.club}</p>
                        <p className="text-xs uppercase text-gray-500">{entry.clubType}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{entry.count}</p>
                    </div>
                  ))}
                  {filteredClubComparison.length === 0 && <p className="text-sm text-gray-600">No cross-club attendance found for this filter.</p>}
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Attendance Trend (by Day)</h2>
              <div className="space-y-2">
                {analytics.attendanceByDay.slice(-14).map((row) => (
                  <div key={row.day} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-700">{row.day}</p>
                    <p className="text-sm font-semibold text-gray-900">{row.count}</p>
                  </div>
                ))}
                {analytics.attendanceByDay.length === 0 && <p className="text-sm text-gray-600">No attendance trend yet.</p>}
              </div>
            </section>

            <section className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Per Event Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Event</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unique</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Members</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Guests</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rotary Guests</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rotaract Guests</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Other Guests</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analytics.eventRows.map((row) => (
                      <tr key={row.eventId}>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.eventDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.eventName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.totalAttendees}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.uniqueAttendees}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.memberCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.guestCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.rotaryGuestCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.rotaractGuestCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.nonRotarianGuestCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.attendanceRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                    {analytics.eventRows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-6 text-center text-gray-600">No events found for this date range.</td>
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

export default ClubAnalyticsPage;
