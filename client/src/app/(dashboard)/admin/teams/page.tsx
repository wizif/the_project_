'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Team, User } from '@/types';
import { Users, Plus, Trash2, ArrowLeft, X, Eye, UserPlus, UserMinus } from 'lucide-react';

export default function AdminTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        api.get('/teams'),
        api.get('/users'),
      ]);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await api.post('/teams', {
        name: formData.name,
        description: formData.description,
        members: formData.members.map(userId => ({ user: userId, role: 'member' })),
      });

      setTeams([...teams, data]);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', members: [] });
    } catch (error: any) {
      console.error('Error creating team:', error);
      alert(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await api.delete(`/teams/${teamId}`);
      setTeams(teams.filter(team => team._id !== teamId));
      if (selectedTeam?._id === teamId) {
        setShowViewModal(false);
        setSelectedTeam(null);
      }
    } catch (error) {
      alert('Failed to delete team');
    }
  };

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId],
    }));
  };

  const handleViewTeam = (team: Team) => {
    setSelectedTeam(team);
    setShowViewModal(true);
  };

  const handleAddMemberToTeam = async (userId: string) => {
    if (!selectedTeam) return;

    try {
      const updatedMembers = [
        ...selectedTeam.members,
        { user: userId, role: 'member' }
      ];

      const { data } = await api.put(`/teams/${selectedTeam._id}`, {
        ...selectedTeam,
        members: updatedMembers,
      });

      setTeams(teams.map(t => t._id === data._id ? data : t));
      setSelectedTeam(data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMemberFromTeam = async (userId: string) => {
    if (!selectedTeam) return;
    if (!confirm('Remove this member from the team?')) return;

    try {
      const updatedMembers = selectedTeam.members.filter(
        (m: any) => (m.user._id || m.user) !== userId
      );

      const { data } = await api.put(`/teams/${selectedTeam._id}`, {
        ...selectedTeam,
        members: updatedMembers,
      });

      setTeams(teams.map(t => t._id === data._id ? data : t));
      setSelectedTeam(data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const getTeamMemberIds = (team: Team): string[] => {
    return team.members?.map((m: any) => m.user._id || m.user) || [];
  };

  const getAvailableUsers = (): User[] => {
    if (!selectedTeam) return users;
    const memberIds = getTeamMemberIds(selectedTeam);
    return users.filter(u => !memberIds.includes(u._id));
  };

  const getTeamMembers = (team: Team): User[] => {
    const memberIds = getTeamMemberIds(team);
    return users.filter(u => memberIds.includes(u._id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-8xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600 dark:text-blue-400" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teams</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Manage teams</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>New Team</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto p-6">
        {teams.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700 transition-colors">
            <Users size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Teams Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first team</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Create Team</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{team.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteTeam(team._id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <Users size={16} className="inline mr-1" />
                      {team.members?.length || 0} members
                    </p>
                  </div>

                  <button
                    onClick={() => handleViewTeam(team)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Eye size={18} />
                    <span>View Members</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE TEAM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateModal(false)} />
          
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Team</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Team Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Members</label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  {users.map(user => (
                    <label key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.members.includes(user._id)}
                        onChange={() => toggleMember(user._id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Team
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW TEAM MEMBERS MODAL */}
      {showViewModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowViewModal(false)} />
          
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTeam.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTeam.description}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Members */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Current Members ({getTeamMembers(selectedTeam).length})
                </h3>
                {getTeamMembers(selectedTeam).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No members yet</p>
                ) : (
                  <div className="space-y-2">
                    {getTeamMembers(selectedTeam).map(user => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMemberFromTeam(user._id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove member"
                        >
                          <UserMinus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Users to Add */}
              {getAvailableUsers().length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Add Members ({getAvailableUsers().length} available)
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getAvailableUsers().map(user => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMemberToTeam(user._id)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Add member"
                        >
                          <UserPlus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
