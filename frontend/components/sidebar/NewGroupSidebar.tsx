import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Check, Users, X, Loader2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export interface UserItem {
  id: number;
  username: string;
  display_name: string;
  phone?: string | null;
  avatar_url: string | null;
}

interface NewGroupSidebarProps {
  token: string;
  currentUserId: number;
  onBack: () => void;
  onGroupCreated: (conversationId: number) => void;
}

export default function NewGroupSidebar({
  token,
  currentUserId,
  onBack,
  onGroupCreated
}: NewGroupSidebarProps) {
  const [step, setStep] = useState<'select_members' | 'group_details'>('select_members');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch users on load or search
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const queryParam = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : '';
        const res = await fetch(`${API_URL}/users/search${queryParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            // Exclude current user
            setAllUsers(data.filter((u: UserItem) => u.id !== currentUserId));
          }
        } else {
          if (isMounted) setError('Failed to load users.');
        }
      } catch {
        if (isMounted) setError('Network error loading users.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, searchQuery ? 300 : 0);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, token, currentUserId, API_URL]);

  const toggleSelectUser = (user: UserItem) => {
    if (user.id === currentUserId) return;
    setSelectedUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 1 || creating) return;
    setCreating(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/conversations/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: groupName.trim(),
          member_ids: selectedUsers.map(u => u.id)
        })
      });

      if (res.ok) {
        const data = await res.json();
        onGroupCreated(data.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || 'Failed to create group.');
      }
    } catch {
      setError('Network error creating group.');
    } finally {
      setCreating(false);
    }
  };

  // Step 1: Select Members
  if (step === 'select_members') {
    const isNextEnabled = selectedUsers.length >= 1;

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 h-[60px]">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title="Cancel"
            >
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-[17px] font-semibold text-gray-900">New group</h2>
          </div>
          <button
            onClick={() => isNextEnabled && setStep('group_details')}
            disabled={!isNextEnabled}
            className={`px-3 py-1 text-[14px] font-medium rounded-lg transition-colors ${
              isNextEnabled
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>

        {/* Selected Users Chips */}
        {selectedUsers.length > 0 && (
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-gray-500">
                Selected ({selectedUsers.length})
              </span>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
              {selectedUsers.map(user => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-800 rounded-full pl-1.5 pr-2 py-0.5 text-[12px] font-medium shadow-xs"
                >
                  <Avatar url={user.avatar_url} name={user.display_name || user.username} size={18} />
                  <span className="truncate max-w-[100px]">{user.display_name}</span>
                  <button
                    onClick={() => toggleSelectUser(user)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, username, or number"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#F2F2F2] rounded-xl py-2 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && (
            <div className="p-4 text-center text-gray-400 text-[13px] flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              Loading users...
            </div>
          )}

          {!loading && error && (
            <div className="p-4 text-center text-red-500 text-[13px]">{error}</div>
          )}

          {!loading && !error && allUsers.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-[13px]">
              {searchQuery ? 'No users found.' : 'No other users registered yet.'}
            </div>
          )}

          {!loading &&
            allUsers.map(user => {
              const isSelected = selectedUsers.some(u => u.id === user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => toggleSelectUser(user)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 hover:bg-blue-100/70' : 'hover:bg-gray-100'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>

                  <Avatar url={user.avatar_url} name={user.display_name || user.username} size={38} />

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-gray-900 truncate">
                      {user.display_name}
                    </p>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500">
                      <span>@{user.username}</span>
                      {user.phone && <span>• {user.phone}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Bottom Bar */}
        <div className="p-3 border-t border-gray-100 bg-white">
          <button
            onClick={() => isNextEnabled && setStep('group_details')}
            disabled={!isNextEnabled}
            className={`w-full py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
              isNextEnabled
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm cursor-pointer'
                : 'bg-blue-300 opacity-50 text-white cursor-not-allowed'
            }`}
          >
            {selectedUsers.length > 0
              ? `Next (${selectedUsers.length} selected)`
              : 'Select at least 1 member'}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Group Details
  const isCreateEnabled = groupName.trim().length > 0 && selectedUsers.length >= 1 && !creating;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 h-[60px]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep('select_members')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Back"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-[17px] font-semibold text-gray-900">Name this group</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Group Avatar & Name Input */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-inner border border-blue-200">
            <Users size={36} />
          </div>

          <div className="w-full">
            <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1 px-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Group name (required)"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              autoFocus
              maxLength={50}
              className="w-full bg-[#F2F2F2] rounded-xl py-2.5 px-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Selected Members Summary */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
              Members ({selectedUsers.length + 1})
            </h3>
            <button
              onClick={() => setStep('select_members')}
              className="text-[12px] text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>

          <div className="space-y-1.5">
            {/* Current user */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-bold">
                  You
                </div>
                <span className="text-[14px] font-medium text-gray-900">You</span>
              </div>
              <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                Admin
              </span>
            </div>

            {/* Selected users */}
            {selectedUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar url={user.avatar_url} name={user.display_name || user.username} size={32} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-gray-900 truncate">
                      {user.display_name}
                    </p>
                    <p className="text-[11px] text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <span className="text-[11px] text-gray-400">Member</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleCreateGroup}
          disabled={!isCreateEnabled}
          className={`w-full py-3 rounded-xl text-[15px] font-medium transition-all duration-150 flex items-center justify-center gap-2 ${
            isCreateEnabled
              ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm cursor-pointer'
              : 'bg-blue-300 opacity-50 text-white cursor-not-allowed'
          }`}
        >
          {creating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Creating group...</span>
            </>
          ) : (
            'Create Group'
          )}
        </button>
      </div>
    </div>
  );
}
