import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
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
}

export default function NewChatModal({ token, onClose, onStartChat }: NewChatModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col h-[500px] max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Chat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by username or name..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#F2F2F2] rounded-lg py-2 pl-10 pr-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="text-center text-gray-500 mt-4 text-sm">Searching...</div>
          )}
          
          {!loading && error && (
            <div className="text-center text-red-500 mt-4 text-sm">{error}</div>
          )}

          {!loading && !error && query && results.length === 0 && (
            <div className="text-center text-gray-500 mt-4 text-sm">No users found.</div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="flex flex-col gap-1">
              {results.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar url={u.avatar_url} name={u.display_name || u.username} size={40} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{u.display_name}</p>
                      <p className="text-gray-500 text-xs">@{u.username}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onStartChat(u.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Chat
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {!query && (
            <div className="text-center text-gray-500 mt-8 text-sm">
              Type a username to find people and start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
