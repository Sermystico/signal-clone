"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPane from "@/components/chat/ChatPane";
import ProfileModal from "@/components/profile/ProfileModal";
import NewChatModal from "@/components/chat/NewChatModal";
import Avatar from "@/components/ui/Avatar";
import { MockConversation, MockMessage, MessageStatus } from "@/types";
import { Menu, MessageCircle, Phone, Layers, Settings } from "lucide-react";

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
  };
  members?: {
    user_id: number;
    user: {
      display_name: string;
      avatar_url: string | null;
      is_online: boolean;
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
  const otherUserId = convType === 'direct' ? (otherMember ? otherMember.user_id : undefined) : undefined;
  
  return {
    id: conv.id,
    type: convType as 'direct' | 'group',
    name,
    avatar,
    lastActivity: conv.updated_at,
    unreadCount: conv.unread_count || 0,
    messages: conv.last_message ? [mapMessage(conv.last_message)] : [],
    isOnline,
    otherUserId,
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

  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showTabs, setShowTabs] = useState(true);
  const [activeTab, setActiveTab] = useState('chats');
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null | undefined>(undefined);
  const wsRef = useRef<WebSocket | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
          const payload = data.payload || data.data; // support both just in case
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
                  unreadCount: isViewing ? 0 : conv.unreadCount + (newMsg.senderId !== user.id ? 1 : 0)
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
          const { user_id, is_online } = data.payload;
          setConversations(prev => prev.map(conv => {
            if (conv.otherUserId === user_id) {
              return { ...conv, isOnline: is_online };
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

  const handleStartChat = async (userId: number) => {
    if (!token || !user) return;
    try {
      // 1. Add contact
      await fetch(`${API_URL}/contacts/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // 2. Create/Get Direct Conversation
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
        
        // Re-fetch conversations to update the list, wait for it
        const listRes = await fetch(`${API_URL}/conversations/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (listRes.ok) {
          const data = await listRes.json();
          setConversations(data.map((c: APIConversation) => mapConversation(c, user.id)));
        }
        
        setActiveId(conv.id);
        setShowNewChat(false);
      }
    } catch (err) {
      console.error("Failed to start chat", err);
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

  const handleGroupCreated = async (convId: number) => {
    try {
      const listRes = await fetch(`${API_URL}/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.ok && user) {
        const listData = await listRes.json();
        setConversations(listData.map((c: APIConversation) => mapConversation(c, user.id)));
      }
      setActiveId(convId);
      setShowNewChat(false);
    } catch (err) {
      console.error("Failed to load group conversation", err);
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
              onClick={() => setActiveTab('chats')}
              title="Chats"
              aria-label="Chats"
              className={`p-2 rounded-lg transition-colors ${activeTab === 'chats' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <MessageCircle size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('calls')}
              title="Calls"
              aria-label="Calls"
              className={`p-2 rounded-lg transition-colors ${activeTab === 'calls' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <Phone size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('stories')}
              title="Stories"
              aria-label="Stories"
              className={`p-2 rounded-lg transition-colors ${activeTab === 'stories' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <Layers size={20} />
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

      <div className={`${activeId ? 'hidden md:block' : 'block'} w-full md:w-[300px] lg:w-[340px] flex-shrink-0 h-full z-20 shadow-sm md:shadow-none`}>
        <Sidebar 
          user={userWithAvatar}
          activeTab={activeTab}
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={(id) => setActiveId(id)}
          onOpenProfile={() => setShowProfile(true)}
          onNewChat={() => setShowNewChat(true)}
          showTabsButton={!showTabs}
          onToggleTabs={() => setShowTabs(true)}
        />
      </div>
      <div className={`${!activeId ? 'hidden md:flex' : 'flex'} flex-1 h-full min-w-0`}>
        <ChatPane 
          currentUserId={user.id}
          conversation={activeConversation}
          onBack={() => setActiveId(null)}
          onSendMessage={handleSendMessage}
        />
      </div>
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
      {showNewChat && (
        <NewChatModal 
          token={token as string}
          onClose={() => setShowNewChat(false)}
          onStartChat={handleStartChat}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
