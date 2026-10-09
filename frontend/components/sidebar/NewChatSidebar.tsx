import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search, Users, AtSign, Hash, Loader2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export interface UserItem {
  id: number;
  username: string;
  display_name: string;
  phone?: string | null;
  avatar_url: string | null;
}

interface NewChatSidebarProps {
  token: string;
  currentUserId: number;
  onBack: () => void;
  onStartChat: (userId: number) => void;
  onOpenNewGroup: () => void;
}

export default function NewChatSidebar({
  token,
  currentUserId,
  onBack,
  onStartChat,
  onOpenNewGroup
}: NewChatSidebarProps) {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<UserItem[]>([]);
  const [searchResults, setSearchResults] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load user contacts initially
  useEffect(() => {
    let isMounted = true;
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/contacts/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const list: UserItem[] = data.map((c: any) => ({
            id: c.contact_user.id,
            username: c.contact_user.username,
            display_name: c.contact_user.display_name,
            phone: c.contact_user.phone,
            avatar_url: c.contact_user.avatar_url
          }));
          setContacts(list.filter(u => u.id !== currentUserId));
        }
      } catch (err) {
        console.error('Failed to load contacts', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContacts();
    return () => {
      isMounted = false;
    };
  }, [token, currentUserId, API_URL]);

  // Handle Search Query
  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }

    let isMounted = true;
    const searchTimer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          const data: UserItem[] = await res.json();
          setSearchResults(data.filter(u => u.id !== currentUserId));
        } else if (isMounted) {
          setError('Failed to search users.');
        }
      } catch {
        if (isMounted) setError('Network error occurred.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(searchTimer);
    };
  }, [query, token, currentUserId, API_URL]);

  const displayList = query.trim() ? searchResults : contacts;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 h-[60px]">
        <button
          onClick={onBack}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          title="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-[17px] font-semibold text-gray-900 mx-auto mr-6">New chat</h2>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Name, username, or number"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#F2F2F2] rounded-xl py-2 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() && (
          <div className="px-2 py-2 border-b border-gray-100 space-y-0.5">
            {/* Action Row: New group */}
            <button
              onClick={onOpenNewGroup}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
                <Users size={20} />
              </div>
              <span className="text-[15px] font-medium text-gray-900">New group</span>
            </button>

            {/* Action Row: Find by username */}
            <button
              onClick={() => {
                setQuery('@');
                inputRef.current?.focus();
              }}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
                <AtSign size={20} />
              </div>
              <span className="text-[15px] font-medium text-gray-900">Find by username</span>
            </button>

            {/* Action Row: Find by phone number */}
            <button
              onClick={() => {
                setQuery('+');
                inputRef.current?.focus();
              }}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
                <Hash size={20} />
              </div>
              <span className="text-[15px] font-medium text-gray-900">Find by phone number</span>
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="px-4 py-2.5 mt-1">
          <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
            {query.trim() ? 'Search Results' : 'Contacts'}
          </h3>
        </div>

        {/* User / Contact List */}
        <div className="px-2 pb-4">
          {loading && (
            <div className="p-4 text-center text-gray-400 text-[13px] flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              Searching...
            </div>
          )}

          {!loading && error && (
            <div className="p-4 text-center text-red-500 text-[13px]">{error}</div>
          )}

          {!loading && !error && query.trim() && displayList.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-[13px]">No matching users found.</div>
          )}

          {!loading && !error && !query.trim() && displayList.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-[13px]">
              No contacts saved yet. Use search above to find registered users.
            </div>
          )}

          {!loading && !error && displayList.length > 0 && (
            <div className="space-y-0.5">
              {displayList.map(user => (
                <div
                  key={user.id}
                  onClick={() => onStartChat(user.id)}
                  className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Avatar url={user.avatar_url} name={user.display_name || user.username} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-gray-900 truncate leading-tight">
                      {user.display_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500 truncate mt-0.5">
                      <span>@{user.username}</span>
                      {user.phone && <span>• {user.phone}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
