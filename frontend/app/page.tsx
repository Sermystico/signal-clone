"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPane from "@/components/chat/ChatPane";
import ProfileModal from "@/components/profile/ProfileModal";
import NewChatModal from "@/components/chat/NewChatModal";
import GroupDetailsModal from "@/components/chat/GroupDetailsModal";
import { MockConversation, MockMessage, MessageStatus } from "@/types";
import { Menu, MessageCircle, Phone, Settings, X, Edit, Users, LogOut } from "lucide-react";
import StoriesIcon from "@/components/icons/StoriesIcon";
import Avatar from "@/components/ui/Avatar";

interface APIMessage {
  id: number;
  content: string;
  sender_id: number;
  created_at: string;
  status: string;
  conversation_id?: number;
}

interface APIConversation {
  id: number;
  type: string;
  updated_at: string;
  unread_count: number;
  last_message?: APIMessage;
  group?: {
    id: number;
    name: string;
    avatar_url: string | null;
    created_by: number;
    members?: {
      user_id: number;
      role: string;
      user: {
        id: number;
        username: string;
        display_name: string;
        phone?: string | null;
        avatar_url: string | null;
      };
    }[];
  };
  members?: {
    user_id: number;
    user: {
      username?: string;
      display_name: string;
      phone?: string | null;
      avatar_url: string | null;
      is_online: boolean;
      last_seen: string;
    };
  }[];
}

const mapMessage = (msg: APIMessage): MockMessage => ({
  id: msg.id,
  content: msg.content,
  senderId: msg.sender_id,
  timestamp: msg.created_at,
  status: msg.status as MessageStatus,
});

const mapConversation = (conv: APIConversation, currentUserId: number): MockConversation => {
  const otherMember = conv.members?.find((m) => m.user_id !== currentUserId);
  const convType = conv.type || 'direct';
  const name = convType === 'group' && conv.group ? conv.group.name : (otherMember ? otherMember.user.display_name : 'Chat');
  const avatar = convType === 'group' && conv.group ? conv.group.avatar_url : (otherMember ? otherMember.user.avatar_url : null);
  const isOnline = convType === 'direct' ? (otherMember ? otherMember.user.is_online : false) : false;
  const lastSeen = convType === 'direct' ? (otherMember ? otherMember.user.last_seen : undefined) : undefined;
  const otherUserId = convType === 'direct' ? (otherMember ? otherMember.user_id : undefined) : undefined;
  const phone = convType === 'direct' ? otherMember?.user.phone : undefined;
  const username = convType === 'direct' ? otherMember?.user.username : undefined;
  
  return {
    id: conv.id,
    type: convType as 'direct' | 'group',
    name,
    avatar,
    lastActivity: conv.updated_at,
    unreadCount: conv.unread_count || 0,
    messages: conv.last_message ? [mapMessage(conv.last_message)] : [],
    isOnline,
    lastSeen,
    otherUserId,
    phone,
    username,
    group: conv.group,
  };
};

export default function Home() {
  const { user, token, logout, loading, updateUser } = useAuth();
  
  const [conversations, setConversations] = useState<MockConversation[]>([]);
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const activeIdRef = useRef(activeId);
  
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const [contactUserIds, setContactUserIds] = useState<Set<number>>(new Set());
  const [sidebarView, setSidebarView] = useState<'chats' | 'new_chat' | 'new_group'>('chats');
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showTabs, setShowTabs] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [navToast, setNavToast] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null | undefined>(undefined);
  const wsRef = useRef<WebSocket | null>(null);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
      }
    };
    if (mobileDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  const handleToggleTabs = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowTabs(prev => !prev);
    } else {
      setMobileDrawerOpen(true);
    }
  }, []);

  // Sync conversation selection with browser history state
  const handleSelectConversation = useCallback((id: number | string | null) => {
    setActiveId(id);
    if (id !== null && typeof window !== 'undefined') {
      window.history.pushState({ chatOpen: true, conversationId: id }, '', window.location.pathname);
    }
  }, []);

  const handleBackFromChat = useCallback(() => {
    setActiveId(null);
    if (typeof window !== 'undefined' && window.history.state?.chatOpen) {
      window.history.back();
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      // When user presses browser back button, close active conversation if one was open
      if (activeIdRef.current !== null) {
        setActiveId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-hide nav toast
  useEffect(() => {
    if (navToast) {
      const t = setTimeout(() => setNavToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [navToast]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/contacts/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ids = new Set<number>(data.map((c: any) => c.contact_user.id));
        setContactUserIds(ids);
      }
    } catch (err) {
      console.error("Failed to load contacts", err);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchContacts();
    }
  }, [token, fetchContacts]);

  // Fetch conversations and maintain WS connection
  useEffect(() => {
    if (!user || !token) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_URL}/conversations/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data.map((c: APIConversation) => mapConversation(c, user.id)));
        }
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      }
    };

    fetchConversations();

    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWs = () => {
      const wsUrl = API_URL.replace('http', 'ws') + `/ws?token=${token}`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message.new') {
          const payload = data.payload || data.data;
          const newMsg = mapMessage(payload);
          const convId = payload.conversation_id;
          
          setConversations(prev => {
            const exists = prev.find(c => c.id === convId);
            if (!exists) {
              fetchConversations();
              return prev;
            }
            return prev.map(conv => {
              if (conv.id === convId) {
                const hasMsg = conv.messages.some(m => m.id === newMsg.id);
                const isViewing = conv.id === activeIdRef.current;
                
                if (isViewing && newMsg.senderId !== user.id) {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ 
                      type: 'message.read', 
                      payload: { message_id: newMsg.id, conversation_id: convId }
                    }));
                  }
                }

                return {
                  ...conv,
                  messages: hasMsg ? conv.messages : [...conv.messages, newMsg],
                  lastActivity: newMsg.timestamp,
                  unreadCount: isViewing ? 0 : conv.unreadCount + (newMsg.senderId !== user.id ? 1 : 0),
                  isTyping: false
                };
              }
              return conv;
            });
          });
        } else if (data.type === 'message.status') {
          const { message_id, conversation_id, status } = data.payload;
          setConversations(prev => prev.map(conv => {
            if (conv.id === conversation_id) {
              return {
                ...conv,
                messages: conv.messages.map(m => 
                  m.id === message_id ? { ...m, status: status as MessageStatus } : m
                )
              };
            }
            return conv;
          }));
        } else if (data.type === 'presence.update') {
          const { user_id, is_online, last_seen } = data.payload;
          setConversations(prev => prev.map(conv => {
            if (conv.otherUserId === user_id) {
              return { ...conv, isOnline: is_online, lastSeen: last_seen };
            }
            return conv;
          }));
        } else if (data.type === 'typing.started') {
          const { conversation_id } = data.payload;
          setConversations(prev => prev.map(conv => {
            if (conv.id === conversation_id) {
              return { ...conv, isTyping: true };
            }
            return conv;
          }));
        } else if (data.type === 'typing.stopped') {
          const { conversation_id } = data.payload;
          setConversations(prev => prev.map(conv => {
            if (conv.id === conversation_id) {
              return { ...conv, isTyping: false };
            }
            return conv;
          }));
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWs, 3000);
      };
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [user, token, API_URL]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeId || !user || !token) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/${activeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const msgs = data.map(mapMessage);
          setConversations(prev => prev.map(c => 
            c.id === activeId ? { ...c, messages: msgs, unreadCount: 0 } : c
          ));
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };
    fetchMessages();
  }, [activeId, user, token, API_URL]);

  // Start Direct Chat (does NOT automatically add as contact)
  const handleStartChat = async (userId: number) => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${API_URL}/conversations/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contact_user_id: userId })
      });
      
      if (res.ok) {
        const conv: APIConversation = await res.json();
        
        const listRes = await fetch(`${API_URL}/conversations/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (listRes.ok) {
          const data = await listRes.json();
          setConversations(data.map((c: APIConversation) => mapConversation(c, user.id)));
        }
        
        handleSelectConversation(conv.id);
        setShowNewChat(false);
      }
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  // Add/Remove Contact explicitly
  const handleToggleContact = async (targetUserId: number, isCurrentlyContact: boolean) => {
    if (!token) return;
    try {
      if (isCurrentlyContact) {
        const res = await fetch(`${API_URL}/contacts/${targetUserId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setContactUserIds(prev => {
            const next = new Set(prev);
            next.delete(targetUserId);
            return next;
          });
          fetchContacts();
        }
      } else {
        const res = await fetch(`${API_URL}/contacts/${targetUserId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setContactUserIds(prev => new Set(prev).add(targetUserId));
          fetchContacts();
        }
      }
    } catch (err) {
      console.error("Failed to toggle contact", err);
      throw err;
    }
  };

  const handleSendMessage = async (conversationId: number | string, content: string) => {
    if (!token || !user) return;
    
    const tempId = `m_new_${Date.now()}`;
    const newMessage: MockMessage = {
      id: tempId,
      content,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, messages: [...conv.messages, newMessage], lastActivity: newMessage.timestamp };
      }
      return conv;
    }));

    try {
      const res = await fetch(`${API_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ conversation_id: conversationId, content })
      });
      
      if (res.ok) {
        const savedMsg = await res.json();
        const mapped = mapMessage(savedMsg);
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: conv.messages.map(m => m.id === tempId ? mapped : m),
              lastActivity: mapped.timestamp
            };
          }
          return conv;
        }));
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleSendTyping = (conversationId: number | string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: isTyping ? 'typing.start' : 'typing.stop',
        payload: { conversation_id: conversationId }
      }));
    }
  };

  const handleGroupCreated = async (convId: number) => {
    try {
      const listRes = await fetch(`${API_URL}/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.ok && user) {
        const listData = await listRes.json();
        setConversations(listData.map((c: APIConversation) => mapConversation(c, user.id)));
      }
      handleSelectConversation(convId);
      setShowNewChat(false);
      setSidebarView('chats');
    } catch (err) {
      console.error("Failed to load group conversation", err);
    }
  };

  const refreshConversations = async () => {
    try {
      const listRes = await fetch(`${API_URL}/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.ok && user) {
        const listData = await listRes.json();
        setConversations(listData.map((c: APIConversation) => mapConversation(c, user.id)));
      }
    } catch (err) {
      console.error("Failed to refresh conversations", err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const activeAvatarUrl = localAvatarUrl !== undefined ? localAvatarUrl : user.avatar_url;
  const userWithAvatar = { ...user, avatar_url: activeAvatarUrl };
  const activeConversation = conversations.find(c => c.id === activeId) || null;
  const isCurrentActiveContact = activeConversation?.otherUserId
    ? contactUserIds.has(activeConversation.otherUserId)
    : false;

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden text-gray-900 font-sans">
      
      {/* Navigation Rail */}
      {showTabs && (
        <div className="hidden md:flex flex-col w-[60px] bg-gray-50 border-r border-gray-200 h-full py-3 items-center justify-between z-30 flex-shrink-0">
          <div className="flex flex-col gap-4 items-center w-full">
            <button 
              onClick={() => setShowTabs(false)} 
              title={showTabs ? "Hide tabs" : "Show tabs"}
              aria-label={showTabs ? "Hide tabs" : "Show tabs"}
              className="p-2 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors focus:outline-none"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => {
                setActiveTab('chats');
                setSidebarView('chats');
              }}
              title="Chats"
              aria-label="Chats"
              className={`p-2 rounded-lg transition-colors ${activeTab === 'chats' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <MessageCircle size={20} />
            </button>
            <button 
              onClick={() => setNavToast('Calls - Coming Soon')}
              title="Calls (Coming Soon)"
              aria-label="Calls"
              className="p-2 rounded-lg transition-colors hover:bg-gray-200 text-gray-600 cursor-pointer"
            >
              <Phone size={20} />
            </button>
            <button 
              onClick={() => setNavToast('Stories - Coming Soon')}
              title="Stories (Coming Soon)"
              aria-label="Stories"
              className="p-2 rounded-lg transition-colors hover:bg-gray-200 text-gray-600 cursor-pointer"
            >
              <StoriesIcon size={20} />
            </button>
          </div>
          <div className="flex flex-col gap-4 items-center w-full">
            <button 
              onClick={() => setShowProfile(true)} 
              title="Settings"
              aria-label="Settings"
              className="p-2 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors focus:outline-none"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar (Conversations / Group Creation Workflow) */}
      <div className={`${activeId ? 'hidden md:block' : 'block'} w-full md:w-[320px] lg:w-[360px] flex-shrink-0 h-full z-20 shadow-sm md:shadow-none`}>
        <Sidebar 
          user={userWithAvatar}
          activeTab={activeTab}
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={handleSelectConversation}
          onOpenProfile={() => setShowProfile(true)}
          onNewChat={() => setSidebarView('new_chat')}
          onOpenNewGroup={() => setSidebarView('new_group')}
          sidebarView={sidebarView}
          onSetSidebarView={setSidebarView}
          onGroupCreated={handleGroupCreated}
          onStartChat={handleStartChat}
          showTabsButton={!showTabs}
          onToggleTabs={handleToggleTabs}
        />
      </div>

      {/* Mobile / Split-Screen Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-[280px] sm:w-[320px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header with User Profile */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 mr-2"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setShowProfile(true);
                }}
              >
                <Avatar url={userWithAvatar.avatar_url} name={userWithAvatar.display_name} size={44} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-[15px] truncate">
                    {userWithAvatar.display_name}
                  </h3>
                  <p className="text-[13px] text-gray-500 truncate">
                    {userWithAvatar.phone || `@${userWithAvatar.username}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors cursor-pointer"
                title="Close menu"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Drawer Menu Items */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
              {/* Chats */}
              <button
                onClick={() => {
                  setActiveTab('chats');
                  setSidebarView('chats');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors cursor-pointer ${
                  activeTab === 'chats' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageCircle size={20} />
                <span className="flex-1 text-left">Chats</span>
                {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
                  <span className="bg-blue-600 text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
                    {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
                  </span>
                )}
              </button>
              
              {/* Calls */}
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setNavToast('Calls - Coming Soon');
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Phone size={20} />
                <span className="flex-1 text-left">Calls</span>
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
              </button>
              
              {/* Stories */}
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setNavToast('Stories - Coming Soon');
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <StoriesIcon size={20} />
                <span className="flex-1 text-left">Stories</span>
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
              </button>

              <hr className="my-2 border-gray-200" />
              
              {/* New Chat */}
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setActiveId(null);
                  setSidebarView('new_chat');
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Edit size={20} />
                <span className="flex-1 text-left">New Chat</span>
              </button>

              {/* New Group */}
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setActiveId(null);
                  setSidebarView('new_group');
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Users size={20} />
                <span className="flex-1 text-left">New Group</span>
              </button>

              <hr className="my-2 border-gray-200" />

              {/* Settings / Profile */}
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setShowProfile(true);
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Settings size={20} />
                <span className="flex-1 text-left">Settings</span>
              </button>
            </div>
            
            {/* Drawer Footer with Logout */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Chat Pane */}
      <div className={`${!activeId ? 'hidden md:flex' : 'flex'} flex-1 h-full min-w-0`}>
        <ChatPane 
          currentUserId={user.id}
          conversation={activeConversation}
          allConversations={conversations}
          token={token as string}
          onBack={handleBackFromChat}
          onSendMessage={handleSendMessage}
          onSendTyping={handleSendTyping}
          onViewDetails={() => setShowGroupDetails(true)}
          isContact={isCurrentActiveContact}
          onToggleContact={handleToggleContact}
        />
      </div>

      {/* Profile Settings Modal */}
      {showProfile && (
        <ProfileModal 
          user={userWithAvatar} 
          onClose={() => setShowProfile(false)} 
          onLogout={logout} 
          onUpdateAvatar={(url) => {
            setLocalAvatarUrl(url);
            if (user) {
              updateUser({ ...user, avatar_url: url });
            }
          }}
        />
      )}

      {/* New Chat Modal (Find contacts / users) */}
      {showNewChat && (
        <NewChatModal 
          token={token as string}
          onClose={() => setShowNewChat(false)}
          onStartChat={handleStartChat}
          onOpenNewGroup={() => {
            setShowNewChat(false);
            setSidebarView('new_group');
          }}
        />
      )}

      {/* Group Details & Member Management Modal */}
      {showGroupDetails && activeConversation?.type === 'group' && (
        <GroupDetailsModal
          conversation={activeConversation}
          currentUserId={user.id}
          token={token as string}
          onClose={() => setShowGroupDetails(false)}
          onUpdate={refreshConversations}
        />
      )}

      {/* Navigation Toast Notification */}
      {navToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <span>{navToast}</span>
        </div>
      )}
    </div>
  );
}
