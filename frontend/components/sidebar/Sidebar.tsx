import React, { useState } from 'react';
import { Search, Edit, MoreVertical } from 'lucide-react';
import { MockConversation } from '@/types';

interface SidebarProps {
  user: any; 
  conversations: MockConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenProfile: () => void;
  className?: string;
}

export default function Sidebar({ 
  user, 
  conversations, 
  activeConversationId, 
  onSelectConversation,
  onOpenProfile,
  className = ""
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col bg-white border-r border-gray-200 h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <button onClick={onOpenProfile} className="focus:outline-none">
          <img 
            src={user?.avatar_url || "https://i.pravatar.cc/150"} 
            alt="Profile" 
            className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity object-cover"
          />
        </button>
        <div className="flex gap-4 text-gray-500">
          <button className="hover:text-gray-700" title="New Chat">
            <Edit size={20} />
          </button>
          <button className="hover:text-gray-700" title="More options">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            return (
              <div 
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors ${activeConversationId === conv.id ? 'bg-blue-50' : ''}`}
              >
                <div className="relative">
                  <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover" />
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{conv.name}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(conv.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate mr-2">
                      {lastMsg ? (lastMsg.senderId === 0 ? `You: ${lastMsg.content}` : lastMsg.content) : "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            No conversations found.
          </div>
        )}
      </div>
    </div>
  );
}
