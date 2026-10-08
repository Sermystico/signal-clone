import React, { useState } from 'react';
import { Search, Edit, MoreVertical } from 'lucide-react';
import { MockConversation } from '@/types';
import Avatar from '@/components/ui/Avatar';

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
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onOpenProfile} className="focus:outline-none flex-shrink-0 rounded-full hover:opacity-80 transition-opacity">
            <Avatar url={user?.avatar_url} name={user?.display_name || user?.username || "User"} size={36} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Chats</h1>
        </div>
        <div className="flex gap-1 text-gray-600">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="New Chat">
            <Edit size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="More options">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="px-4 pb-3 bg-white">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F2F2F2] rounded-lg py-1.5 pl-9 pr-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const isActive = activeConversationId === conv.id;
            const hasUnread = conv.unreadCount > 0;
            return (
              <div 
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`flex items-center px-3 py-2.5 mx-2 my-0.5 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-[#E5E5E5]' : 'hover:bg-gray-100'}`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar url={conv.avatar} name={conv.name} size={48} />
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`text-[16px] truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                      {conv.name}
                    </h3>
                    <span className={`text-[13px] flex-shrink-0 ml-2 ${hasUnread ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                      {new Date(conv.lastActivity).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[14px] truncate mr-2 ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {lastMsg ? (lastMsg.senderId === 0 ? `You: ${lastMsg.content}` : lastMsg.content) : "No messages yet"}
                    </p>
                    {hasUnread && (
                      <span className="bg-blue-600 text-white text-[12px] font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-500 text-[15px]">
            No chats found.
          </div>
        )}
      </div>
    </div>
  );
}
