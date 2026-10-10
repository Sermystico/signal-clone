import React, { useState, useRef, useEffect } from 'react';
import { Search, Edit, MoreVertical, MessageSquare, Users, Settings } from 'lucide-react';
import { MockConversation } from '@/types';
import { useAuth, User } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';
import NewGroupSidebar from './NewGroupSidebar';
import NewChatSidebar from './NewChatSidebar';

interface SidebarProps {
  user: User;
  activeTab: string;
  conversations: MockConversation[];
  activeConversationId: number | string | null;
  onSelectConversation: (id: number | string) => void;
  onOpenProfile: () => void;
  onNewChat: () => void;
  onOpenNewGroup?: () => void;
  sidebarView?: 'chats' | 'new_chat' | 'new_group';
  onSetSidebarView?: (view: 'chats' | 'new_chat' | 'new_group') => void;
  onGroupCreated?: (conversationId: number) => void;
  onStartChat: (userId: number) => void;
  showTabsButton?: boolean;
  onToggleTabs?: () => void;
  className?: string;
}

const ensureUTC = (ts: string) => (ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');

export default function Sidebar({
  user,
  activeTab,
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onNewChat,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenNewGroup,
  sidebarView: controlledView,
  onSetSidebarView,
  onGroupCreated,
  onStartChat,
  showTabsButton,
  onToggleTabs,
  className = ''
}: SidebarProps) {
  const { token } = useAuth();
  const [internalView, setInternalView] = useState<'chats' | 'new_chat' | 'new_group'>('chats');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const [searchResults, setSearchResults] = useState<{
    users: { id: number; display_name: string; avatar_url?: string; phone?: string }[];
    conversations: { id: number; name?: string; avatar?: string }[];
    messages: { id: number; conversation_id: number; content: string; created_at: string }[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const currentView = controlledView !== undefined ? controlledView : internalView;
  const setView = (v: 'chats' | 'new_chat' | 'new_group') => {
    if (onSetSidebarView) onSetSidebarView(v);
    else setInternalView(v);
  };

  // Search logic
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, token, API_URL]);

  // View: New Chat in Left Sidebar
  if (currentView === 'new_chat') {
    return (
      <div className={`flex flex-col bg-white border-r border-gray-200 h-full ${className}`}>
        <NewChatSidebar
          token={token || ''}
          currentUserId={user.id}
          onBack={() => setView('chats')}
          onStartChat={userId => {
            setView('chats');
            onStartChat(userId);
          }}
          onOpenNewGroup={() => setView('new_group')}
        />
      </div>
    );
  }

  // View: New Group in Left Sidebar
  if (currentView === 'new_group') {
    return (
      <div className={`flex flex-col bg-white border-r border-gray-200 h-full ${className}`}>
        <NewGroupSidebar
          token={token || ''}
          currentUserId={user.id}
          onBack={() => setView('chats')}
          onGroupCreated={convId => {
            setView('chats');
            if (onGroupCreated) onGroupCreated(convId);
            onSelectConversation(convId);
          }}
        />
      </div>
    );
  }

  const filteredConversations = conversations
    .filter(c => {
      const matchesUnread = showUnreadOnly ? c.unreadCount > 0 : true;
      return matchesUnread;
    })
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

  return (
    <div className={`flex flex-col bg-white border-r border-gray-200 h-full relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white h-[60px]">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTabs}
            title="Menu & Options"
            aria-label="Menu & Options"
            className={`focus:outline-none p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors ${
              showTabsButton ? 'block' : 'md:hidden block'
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-700"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900 capitalize">{activeTab}</h2>
        </div>

        <div className="flex items-center gap-1 text-gray-600">
          <button
            onClick={() => setView('new_chat')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none cursor-pointer"
            title="New Chat"
            aria-label="New Chat"
          >
            <Edit size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(prev => !prev)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none cursor-pointer"
              title="More options"
              aria-label="More options"
            >
              <MoreVertical size={20} />
            </button>
            {showMoreMenu && (
              <div
                ref={moreMenuRef}
                className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 text-[14px] animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setView('new_group');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 text-gray-700 text-left transition-colors cursor-pointer"
                >
                  <Users size={16} />
                  <span>New group</span>
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 text-gray-700 text-left transition-colors cursor-pointer"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>
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
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#F2F2F2] rounded-lg py-1.5 pl-9 pr-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              showUnreadOnly ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={showUnreadOnly ? 'Show all' : 'Show unread only'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {/* Conversation List / Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.trim() ? (
          <div className="py-2">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500 text-[14px]">Searching...</div>
            ) : searchResults ? (
              <>
                {(searchResults.users.length > 0 || searchResults.conversations.length > 0) && (
                  <div className="mb-4">
                    <h3 className="px-4 py-2 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
                      Chats & Contacts
                    </h3>
                    {searchResults.conversations.map(conv => {
                      const existingConv = conversations.find(c => c.id === conv.id);
                      if (!existingConv) return null;
                      return (
                        <div
                          key={`conv_${conv.id}`}
                          onClick={() => onSelectConversation(conv.id)}
                          className="flex items-center px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <Avatar url={existingConv.avatar} name={existingConv.name} size={40} />
                          <div className="ml-3 flex-1 min-w-0">
                            <h3 className="text-[15px] font-medium text-gray-900 truncate">
                              {existingConv.name}
                            </h3>
                          </div>
                        </div>
                      );
                    })}
                    {searchResults.users.map(u => (
                      <div
                        key={`user_${u.id}`}
                        onClick={() => onStartChat(u.id)}
                        className="flex items-center px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <Avatar url={u.avatar_url} name={u.display_name} size={40} />
                        <div className="ml-3 flex-1 min-w-0">
                          <h3 className="text-[15px] font-medium text-gray-900 truncate">
                            {u.display_name}
                          </h3>
                          {u.phone && <p className="text-[13px] text-gray-500">{u.phone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.messages.length > 0 && (
                  <div>
                    <h3 className="px-4 py-2 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
                      Messages
                    </h3>
                    {searchResults.messages.map(msg => {
                      const existingConv = conversations.find(c => c.id === msg.conversation_id);
                      const title = existingConv ? existingConv.name : 'Unknown Chat';
                      const avatar = existingConv ? existingConv.avatar : null;
                      return (
                        <div
                          key={`msg_${msg.id}`}
                          onClick={() => onSelectConversation(msg.conversation_id)}
                          className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <Avatar url={avatar} name={title} size={40} />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h3 className="text-[15px] font-medium text-gray-900 truncate">{title}</h3>
                              <span className="text-[12px] text-gray-500 flex-shrink-0 ml-2">
                                {new Date(ensureUTC(msg.created_at)).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[14px] text-gray-600 truncate">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchResults.users.length === 0 &&
                  searchResults.conversations.length === 0 &&
                  searchResults.messages.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-[14px]">No results found.</div>
                  )}
              </>
            ) : null}
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map(conv => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            const isActive = activeConversationId === conv.id;
            const hasUnread = conv.unreadCount > 0;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`flex items-center px-3 py-2.5 mx-2 my-0.5 rounded-xl cursor-pointer transition-colors ${
                  isActive ? 'bg-[#E5E5E5]' : 'hover:bg-gray-100'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar url={conv.avatar} name={conv.name} size={48} />
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3
                      className={`text-[16px] truncate ${
                        hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                      }`}
                    >
                      {conv.name}
                    </h3>
                    <span
                      className={`text-[13px] flex-shrink-0 ml-2 ${
                        hasUnread ? 'font-medium text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {new Date(ensureUTC(conv.lastActivity)).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    {conv.isTyping ? (
                      <p className="text-[14px] text-blue-600 font-medium truncate mr-2">typing...</p>
                    ) : (
                      <p
                        className={`text-[14px] truncate mr-2 ${
                          hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}
                      >
                        {lastMsg
                          ? lastMsg.senderId === user.id
                            ? `You: ${lastMsg.content}`
                            : lastMsg.content
                          : 'No messages yet'}
                      </p>
                    )}
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
          <div className="p-6 text-center text-gray-500 text-[14px] flex flex-col items-center">
            <p className="mb-3">No chats yet.</p>
            <button
              onClick={() => setView('new_chat')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[13px] font-medium transition-colors cursor-pointer"
            >
              <MessageSquare size={15} /> Start a New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
