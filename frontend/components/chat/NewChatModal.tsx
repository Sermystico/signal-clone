import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Users, AtSign, Hash } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface UserResult {
  id: number;
  username: string;
  display_name: string;
  phone?: string | null;
  avatar_url: string | null;
}

interface NewChatModalProps {
  token: string;
  onClose: () => void;
  onStartChat: (userId: number) => void;
  onOpenNewGroup?: () => void;
}

export default function NewChatModal({ token, onClose, onStartChat, onOpenNewGroup }: NewChatModalProps) {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setContacts(data.map((c: any) => ({
            id: c.contact_user.id,
            username: c.contact_user.username,
            display_name: c.contact_user.display_name,
            phone: c.contact_user.phone,
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
        const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setError("Failed to search users.");
        }
      } catch {
        setError("Network error occurred.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query, token, API_URL]);

  const displayList = query.trim() ? results : contacts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
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
            <div className="px-2 border-b border-gray-100 pb-2">
              <button 
                onClick={() => {
                  onClose();
                  if (onOpenNewGroup) onOpenNewGroup();
                }} 
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <span className="text-[15px] font-medium text-gray-900 block">New group</span>
                  <span className="text-[12px] text-gray-500">Group messaging with multiple members</span>
                </div>
              </button>
              <button 
                onClick={() => {
                  setQuery("@");
                }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  <AtSign size={20} />
                </div>
                <span className="text-[15px] text-gray-900">Find by username</span>
              </button>
              <button 
                onClick={() => {
                  setQuery("+");
                }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  <Hash size={20} />
                </div>
                <span className="text-[15px] text-gray-900">Find by phone number</span>
              </button>
            </div>
          )}

          <div className="px-6 py-3 mt-2">
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
              {query.trim() ? "Search Results" : "Contacts"}
            </h3>
          </div>

          <div className="px-2 pb-4">
            {loading && (
              <div className="text-center text-gray-400 mt-4 text-[13px]">Searching...</div>
            )}
            
            {!loading && error && (
              <div className="text-center text-red-500 mt-4 text-[13px]">{error}</div>
            )}

            {!loading && !error && query && displayList.length === 0 && (
              <div className="text-center text-gray-400 mt-4 text-[13px]">No users found.</div>
            )}

            {!loading && !error && displayList.length > 0 && (
              <div className="flex flex-col space-y-1">
                {displayList.map((u) => (
                  <button 
                    key={u.id} 
                    onClick={() => {
                      onStartChat(u.id);
                      onClose();
                    }}
                    className="flex items-center gap-3.5 px-4 py-2.5 w-full hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <Avatar url={u.avatar_url} name={u.display_name || u.username} size={40} />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-gray-900 leading-tight truncate">{u.display_name}</p>
                      <p className="text-[12px] text-gray-500 truncate">
                        @{u.username} {u.phone ? `• ${u.phone}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {!loading && !error && !query && displayList.length === 0 && (
              <div className="text-center text-gray-400 mt-4 text-[13px]">
                No contacts saved yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
