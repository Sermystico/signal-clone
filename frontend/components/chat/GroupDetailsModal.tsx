import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, UserMinus, Search, Loader2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { MockConversation } from '@/types';

interface GroupDetailsModalProps {
  conversation: MockConversation;
  currentUserId: number;
  token: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface UserItem {
  id: number;
  username: string;
  display_name: string;
  phone?: string | null;
  avatar_url: string | null;
}

export default function GroupDetailsModal({
  conversation,
  currentUserId,
  token,
  onClose,
  onUpdate
}: GroupDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'add'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const group = conversation.group;
  const isGroupAdmin = group?.members?.some(m => m.user_id === currentUserId && m.role === 'admin');

  useEffect(() => {
    if (activeTab === 'add' && isGroupAdmin) {
      const fetchAvailableUsers = async () => {
        setLoading(true);
        setError('');
        try {
          const queryParam = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : '';
          const res = await fetch(`${API_URL}/users/search${queryParam}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data: UserItem[] = await res.json();
            const existingMemberIds = new Set(group?.members?.map(m => m.user_id) || []);
            setAvailableUsers(data.filter(u => !existingMemberIds.has(u.id) && u.id !== currentUserId));
          } else {
            setError('Failed to load users.');
          }
        } catch (err) {
          setError('Network error loading users.');
        } finally {
          setLoading(false);
        }
      };

      const timer = setTimeout(fetchAvailableUsers, searchQuery ? 300 : 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, searchQuery, token, API_URL, group?.members, isGroupAdmin, currentUserId]);

  const handleAddMember = async (userId: number) => {
    setActionLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/conversations/${conversation.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        setSuccessMsg('Member added successfully');
        onUpdate();
        setActiveTab('members');
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Failed to add member.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    setActionLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/conversations/${conversation.id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSuccessMsg('Member removed successfully');
        onUpdate();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Failed to remove member.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/conversations/${conversation.id}/leave`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        onUpdate();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Failed to leave group.');
      }
    } catch (err) {
      setError('Network error occurred.');
    }
  };

  if (!group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[620px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900 mx-auto ml-6 flex-1 text-center truncate">
            {group.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Group Info Profile Block */}
        <div className="p-5 flex flex-col items-center border-b border-gray-100 bg-gray-50/50">
          <Avatar url={group.avatar_url} name={group.name} size={72} />
          <h3 className="text-[18px] font-bold text-gray-900 mt-3">{group.name}</h3>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Group • {group.members?.length || 0} members
          </p>
        </div>

        {/* Tabs */}
        {isGroupAdmin && (
          <div className="flex border-b border-gray-100 bg-white">
            <button
              className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => {
                setActiveTab('members');
                setError('');
              }}
            >
              Members ({group.members?.length || 0})
            </button>
            <button
              className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
                activeTab === 'add'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => {
                setActiveTab('add');
                setError('');
              }}
            >
              Add Members
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 bg-red-50 text-red-600 text-[13px] rounded-xl border border-red-100">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-green-50 text-green-700 text-[13px] rounded-xl border border-green-100">
            {successMsg}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'members' && (
            <div className="py-2 divide-y divide-gray-50">
              {group.members?.map(member => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      url={member.user.avatar_url}
                      name={member.user.display_name || member.user.username}
                      size={40}
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-gray-900 truncate">
                        {member.user.display_name}
                        {member.user_id === currentUserId && (
                          <span className="text-gray-400 ml-1 font-normal">(You)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <span>@{member.user.username}</span>
                        {member.user.phone && <span>• {member.user.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        <Shield size={11} className="text-blue-600" /> Admin
                      </span>
                    ) : (
                      <span className="text-[12px] text-gray-400">Member</span>
                    )}

                    {isGroupAdmin && member.user_id !== currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={actionLoading === member.user_id}
                        className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-full transition-colors ml-1"
                        title="Remove member"
                      >
                        {actionLoading === member.user_id ? (
                          <Loader2 size={16} className="animate-spin text-red-500" />
                        ) : (
                          <UserMinus size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'add' && isGroupAdmin && (
            <div className="p-3">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users to add..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F2F2F2] rounded-xl py-2 pl-9 pr-4 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>

              {loading && (
                <div className="p-4 text-center text-gray-400 text-[13px] flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  Loading users...
                </div>
              )}

              {!loading && availableUsers.length === 0 && (
                <div className="text-center p-6 text-gray-400 text-[13px]">
                  {searchQuery ? 'No matching users found.' : 'All users are already in this group.'}
                </div>
              )}

              <div className="space-y-1">
                {availableUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        url={user.avatar_url}
                        name={user.display_name || user.username}
                        size={36}
                      />
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-gray-900 truncate">
                          {user.display_name}
                        </p>
                        <p className="text-[12px] text-gray-500 truncate">
                          @{user.username} {user.phone ? `• ${user.phone}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user.id)}
                      disabled={actionLoading === user.id}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {actionLoading === user.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <UserPlus size={14} /> Add
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleLeaveGroup}
            className="w-full py-2.5 text-red-600 text-[14px] font-medium hover:bg-red-50 rounded-xl transition-colors"
          >
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
}
