import { useAuth } from '@context/useAuth';
import { memberService } from '@services/firebase/member-service';
import { CreateMemberInput, Member } from '@types/member';
import { AlertCircle, Loader, Plus, Search, UserCheck, UserMinus, Users, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const emptyForm: CreateMemberInput = {
  name: '',
  email: '',
  phone: '',
  memberId: '',
  club: '',
};

const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateMemberInput>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<CreateMemberInput>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!currentAdmin?.clubId) return;
    setIsLoading(true);
    try {
      const data = await memberService.getAllActiveMembers(currentAdmin.clubId);
      setMembers(data);
    } catch (error) {
      toast.error('Failed to load members');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAdmin?.clubId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filtered = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.phone.includes(term) ||
      (m.memberId ?? '').toLowerCase().includes(term)
    );
  });

  const validateForm = (): boolean => {
    const errors: Partial<CreateMemberInput> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Valid email required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof CreateMemberInput]) {
      setFormErrors((prev) => { const n = { ...prev }; delete n[name as keyof CreateMemberInput]; return n; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (!currentAdmin?.clubId) {
        toast.error('Admin club not configured');
        return;
      }

      const newMember = await memberService.createMember(
        formData,
        currentAdmin.clubId,
        currentAdmin.id
      );
      setMembers((prev) => [newMember, ...prev]);
      setFormData(emptyForm);
      setShowForm(false);
      toast.success(`Member "${newMember.name}" added successfully!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (member: Member) => {
    if (!window.confirm(`Deactivate "${member.name}"? They won't appear in check-in searches.`)) return;
    try {
      await memberService.updateMember(member.id, { isActive: false });
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success(`${member.name} deactivated`);
    } catch (error) {
      toast.error('Failed to deactivate member');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                aria-label="Go back"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Members</h1>
                <p className="text-gray-600 mt-1">{members.length} active members</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Member
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Add Member Form */}
        {showForm && (
          <div className="card border-2 border-primary-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Member</h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormData(emptyForm); setFormErrors({}); }}
                aria-label="Close form"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />{formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="member-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`input-field ${formErrors.email ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />{formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className={`input-field ${formErrors.phone ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />{formErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 mb-1">
                    Member ID
                  </label>
                  <input
                    id="memberId"
                    type="text"
                    name="memberId"
                    value={formData.memberId}
                    onChange={handleChange}
                    placeholder="R12345"
                    className="input-field"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="club" className="block text-sm font-medium text-gray-700 mb-1">
                    Club Name
                  </label>
                  <input
                    id="club"
                    type="text"
                    name="club"
                    value={formData.club}
                    onChange={handleChange}
                    placeholder="Rotaract Club of..."
                    className="input-field"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormData(emptyForm); setFormErrors({}); }}
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
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <label htmlFor="member-search" className="sr-only">Search members</label>
            <input
              id="member-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone or member ID..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading members...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">
              {searchTerm ? 'No members match your search' : 'No members yet'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="btn-primary mt-6 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Member
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing {filtered.length} of {members.length} members
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Member ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Club</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-primary-500 shrink-0" />
                          <span className="font-medium text-gray-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.memberId || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {member.club || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeactivate(member)}
                          title="Deactivate member"
                          className="flex items-center gap-1 text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1 hover:bg-red-50 transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MembersPage;
