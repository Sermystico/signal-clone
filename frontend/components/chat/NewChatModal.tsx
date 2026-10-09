import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Users, AtSign, Hash } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface UserResult {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface NewChatModalProps {
  token: string;
  onClose: () => void;
  onStartChat: (userId: number) => void;
  onGroupCreated: (conversationId: number) => void;
}

export default function NewChatModal({ token, onClose, onStartChat, onGroupCreated }: NewChatModalProps) {
  const [view, setView] = useState<'search' | 'create_group'>('search');
  const [groupName, setGroupName] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [contacts, setContacts] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Fetch contacts for default view
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API_URL}/contacts/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map to UserResult format
          setContacts(data.map((c: any) => ({
            id: c.contact_user.id,
            username: c.contact_user.username,
            display_name: c.contact_user.display_name,
            avatar_url: c.contact_user.avatar_url
          })));
        }
      } catch (err) {
        console.error("Failed to load contacts", err);
      }
    };
    fetchContacts();
  }, [token, API_URL]);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      setError("");
      
      try {
        const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setError("Failed to search users.");
        }
      } catch (err) {
        setError("Network error occurred.");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [query, token, API_URL]);
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;
    setCreatingGroup(true);
    try {
      const res = await fetch(`${API_URL}/conversations/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: groupName,
          member_ids: selectedContacts
        })
      });
      if (res.ok) {
        const data = await res.json();
        onGroupCreated(data.id);
        onClose(); 
      } else {
        setError("Failed to create group.");
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const displayList = query.trim() ? results : contacts;

  if (view === 'create_group') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button onClick={() => setView('search')} className="text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-[17px] font-semibold text-gray-900 mx-auto mr-8">New group</h2>
          </div>

          <div className="p-4 border-b border-gray-100">
            <input 
              type="text" 
              placeholder="Group name" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#F3F4F6] rounded-xl py-2 px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            <h3 className="px-4 py-2 text-[15px] font-bold text-gray-900">Select Contacts</h3>
            {contacts.map((u) => (
              <label key={u.id} className="flex items-center gap-4 px-4 py-3 w-full hover:bg-gray-50 transition-colors cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedContacts.includes(u.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedContacts(prev => [...prev, u.id]);
                    else setSelectedContacts(prev => prev.filter(id => id !== u.id));
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Avatar url={u.avatar_url} name={u.display_name || u.username} size={40} />
                <div className="text-left flex-1">
                  <p className="text-[15px] text-gray-900 leading-tight">{u.display_name}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedContacts.length === 0 || creatingGroup}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creatingGroup ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-[17px] font-semibold text-gray-900 mx-auto mr-8">New chat</h2>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Name, username, or number" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#F3F4F6] rounded-xl py-2 pl-10 pr-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!query && (
            <div className="px-2">
              <button onClick={() => setView('create_group')} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  <Users size={20} />
                </div>
                <span className="text-[15px] text-gray-900">New group</span>
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  <AtSign size={20} />
                </div>
                <span className="text-[15px] text-gray-900">Find by username</span>
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  <Hash size={20} />
                </div>
                <span className="text-[15px] text-gray-900">Find by phone number</span>
              </button>
            </div>
          )}

          <div className="px-6 py-3 mt-2">
            <h3 className="text-[15px] font-bold text-gray-900">
              {query.trim() ? "Search Results" : "Contacts"}
            </h3>
          </div>

          <div className="px-2 pb-4">
            {loading && (
              <div className="text-center text-gray-500 mt-4 text-sm">Searching...</div>
            )}
            
            {!loading && error && (
              <div className="text-center text-red-500 mt-4 text-sm">{error}</div>
            )}

            {!loading && !error && query && displayList.length === 0 && (
              <div className="text-center text-gray-500 mt-4 text-sm">No users found.</div>
            )}

            {!loading && !error && displayList.length > 0 && (
              <div className="flex flex-col">
                {displayList.map((u) => (
                  <button 
                    key={u.id} 
                    onClick={() => onStartChat(u.id)}
                    className="flex items-center gap-4 px-4 py-3 w-full hover:bg-gray-50 transition-colors"
                  >
                    <Avatar url={u.avatar_url} name={u.display_name || u.username} size={40} />
                    <div className="text-left flex-1">
                      <p className="text-[15px] text-gray-900 leading-tight">{u.display_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {!loading && !error && !query && displayList.length === 0 && (
              <div className="text-center text-gray-500 mt-4 text-[14px]">
                No contacts yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
