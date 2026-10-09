"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPane from "@/components/chat/ChatPane";
import ProfileModal from "@/components/profile/ProfileModal";
import Avatar from "@/components/ui/Avatar";
import { MockConversation, MockMessage, MessageStatus } from "@/types";

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
  const name = otherMember ? otherMember.user.display_name : 'Group Chat';
  const avatar = otherMember ? otherMember.user.avatar_url : null;
  const isOnline = otherMember ? otherMember.user.is_online : false;
  
  return {
    id: conv.id,
    type: conv.type as 'direct' | 'group',
    name,
    avatar,
    lastActivity: conv.updated_at,
    unreadCount: conv.unread_count || 0,
    messages: conv.last_message ? [mapMessage(conv.last_message)] : [],
    isOnline,
  };
};

export default function Home() {
  const { user, token, logout, loading } = useAuth();
  
  const [conversations, setConversations] = useState<MockConversation[]>([]);
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const activeIdRef = useRef(activeId);
  
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const [showProfile, setShowProfile] = useState(false);
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

    const wsUrl = API_URL.replace('http', 'ws') + `/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message.new') {
        const newMsg = mapMessage(data.data);
        const convId = data.data.conversation_id;
        
        setConversations(prev => {
          const exists = prev.find(c => c.id === convId);
          if (!exists) {
            fetchConversations();
            return prev;
          }
          return prev.map(conv => {
            if (conv.id === convId) {
              const hasMsg = conv.messages.some(m => m.id === newMsg.id);
              return {
                ...conv,
                messages: hasMsg ? conv.messages : [...conv.messages, newMsg],
                lastActivity: newMsg.timestamp,
                unreadCount: conv.id === activeIdRef.current ? 0 : conv.unreadCount + 1
              };
            }
            return conv;
          });
        });
      }
    };

    return () => {
      ws.close();
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
      <div className="hidden md:flex flex-col w-[64px] bg-[#F3F3F3] border-r border-gray-200 h-full py-3 items-center justify-between z-30 flex-shrink-0">
        <div className="flex flex-col gap-3 items-center w-full">
          <button onClick={() => setShowProfile(true)} className="focus:outline-none mb-2 mt-1 hover:opacity-80 transition-opacity">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className="p-2.5 bg-white rounded-xl cursor-pointer shadow-sm text-gray-900">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2z" /></svg>
          </div>
          <div className="p-2.5 hover:bg-gray-200 rounded-xl cursor-pointer text-gray-700 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <div className="p-2.5 hover:bg-gray-200 rounded-xl cursor-pointer text-gray-700 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="9"></rect><rect x="14" y="7" width="3" height="5"></rect></svg>
          </div>
        </div>
        <div className="flex flex-col gap-3 items-center w-full">
          <button onClick={() => setShowProfile(true)} className="focus:outline-none mb-1">
            <Avatar url={activeAvatarUrl} name={userWithAvatar.display_name || "User"} size={32} />
          </button>
          <div className="p-2.5 hover:bg-gray-200 rounded-xl cursor-pointer text-gray-700 transition-colors" onClick={() => setShowProfile(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
        </div>
      </div>
      <div className={`${activeId ? 'hidden md:block' : 'block'} w-full md:w-[300px] lg:w-[340px] flex-shrink-0 h-full z-20 shadow-sm md:shadow-none`}>
        <Sidebar 
          user={userWithAvatar}
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={(id) => setActiveId(id)}
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>
      <div className={`${!activeId ? 'hidden md:flex' : 'flex'} flex-1 h-full min-w-0`}>
        <ChatPane 
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
          onUpdateAvatar={(url) => setLocalAvatarUrl(url)}
        />
      )}
    </div>
  );
}
