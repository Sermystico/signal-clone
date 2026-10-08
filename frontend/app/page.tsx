"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatPane from "@/components/chat/ChatPane";
import ProfileModal from "@/components/profile/ProfileModal";
import { mockConversations } from "@/data/mockData";
import { MockConversation, MockMessage } from "@/types";

export default function Home() {
  const { user, logout, loading } = useAuth();
  
  // Local state for UI Shell Mock functionality
  const [conversations, setConversations] = useState<MockConversation[]>(mockConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Handle local mock sending of a message
  const handleSendMessage = (conversationId: string, content: string) => {
    const newMessage: MockMessage = {
      id: `m_new_${Date.now()}`,
      content,
      senderId: 0, // 0 represents the current user
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastActivity: newMessage.timestamp
        };
      }
      return conv;
    }));
    
    // Simulate message delivery status change after 1s to make the shell interactive
    setTimeout(() => {
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          const updatedMessages = conv.messages.map(m => 
            m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m
          );
          return { ...conv, messages: updatedMessages };
        }
        return conv;
      }));
    }, 1000);
  };

  // Global loading state while checking session
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Prevent rendering if unauthenticated, the AuthContext redirects automatically
  if (!user) return null;

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden text-gray-900">
      
      {/* Sidebar container: hidden on mobile if a chat is active */}
      <div className={`${activeId ? 'hidden md:block' : 'block'} w-full md:w-[350px] lg:w-[400px] flex-shrink-0 h-full`}>
        <Sidebar 
          user={user}
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={(id) => setActiveId(id)}
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>

      {/* Chat container: hidden on mobile if NO chat is active */}
      <div className={`${!activeId ? 'hidden md:flex' : 'flex'} flex-1 h-full min-w-0`}>
        <ChatPane 
          conversation={activeConversation}
          onBack={() => setActiveId(null)}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Profile/Settings Modal Overlay */}
      {showProfile && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onLogout={logout} 
        />
      )}
      
    </div>
  );
}
