import { attendanceService } from '@services/firebase/attendance-service';
import { eventService } from '@services/firebase/event-service';
import { memberService } from '@services/firebase/member-service';
import { Member } from '@types/member';
import { AlertCircle, ArrowLeft, Check, Loader, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const MemberCheckInPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{ success: boolean; isDuplicate: boolean; message: string } | null>(null);
  const [eventClubId, setEventClubId] = useState<string>('');

  useEffect(() => {
    const loadEventClub = async () => {
      if (!eventId) return;
      try {
        const event = await eventService.getEventById(eventId);
        setEventClubId(event?.clubId || '');
      } catch (error) {
        setEventClubId('');
      }
    };
    loadEventClub();
  }, [eventId]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (!eventClubId) {
        setSearchResults([]);
        return;
      }
      const results = await memberService.searchMembers(term, eventClubId);
      setSearchResults(results);
    } catch (error) {
      toast.error('Failed to search members');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleCheckIn = async () => {
    if (!selectedMember || !eventId) {
      toast.error('Invalid check-in data');
      return;
    }

    setIsCheckingIn(true);
    try {
      const result = await attendanceService.recordAttendance(
        eventId,
        'member',
        selectedMember.id,
        selectedMember.name,
        selectedMember.email,
        selectedMember.phone,
        eventClubId
      );

      setCheckInResult(result);

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
              attendeeName: selectedMember.name,
              attendeeEmail: selectedMember.email,
              attendeePhone: selectedMember.phone,
              type: 'member',
              club: selectedMember.club,
            },
          });
        }, 1000);
      }
    } catch (error) {
      toast.error('Check-in failed');
      console.error(error);
    } finally {
      setIsCheckingIn(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Member Check-In</h1>
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
            <p className="text-green-700 text-lg mb-4">
              Welcome {selectedMember?.name}!
            </p>
            <p className="text-sm text-green-600">
              Redirecting back to scanner...
            </p>
          </div>
        )}

        {/* Member Already Selected */}
        {selectedMember && !checkInResult && (
          <div className="card">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Confirm Member
              </h2>
              <p className="text-gray-600">Is this the correct member?</p>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Member Name</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedMember.name}
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <span className="font-medium">Email:</span> {selectedMember.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedMember.phone}
                  </div>
                  {selectedMember.club && (
                    <div>
                      <span className="font-medium">Club:</span> {selectedMember.club}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setCheckInResult(null);
                }}
                className="btn-secondary flex-1"
                disabled={isCheckingIn}
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isCheckingIn && <Loader className="w-4 h-4 animate-spin" />}
                {isCheckingIn ? 'Checking In...' : 'Confirm Check-In'}
              </button>
            </div>
          </div>
        )}

        {/* Search State */}
        {!selectedMember && !checkInResult && (
          <div className="card">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Name</h2>
              <p className="text-gray-600">Search for your name or email to check in</p>
            </div>

            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <label htmlFor="member-search" className="sr-only">Search members</label>
                <input
                  id="member-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Loading State */}
            {isSearching && (
              <div className="text-center py-8">
                <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Searching...</p>
              </div>
            )}

            {/* Results */}
            {!isSearching && searchTerm.length >= 2 && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-all text-left"
                  >
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    {member.club && (
                      <p className="text-sm text-gray-500 mt-1">Club: {member.club}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No members found</p>
                <p className="text-sm text-gray-500 mb-6">
                  If you're not in the system, please contact the organizers
                </p>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-secondary"
                >
                  Go Back
                </button>
              </div>
            )}

            {/* Help Text */}
            {searchTerm.length < 2 && searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Start typing your name or email to search</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberCheckInPage;
