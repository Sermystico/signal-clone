import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, MoreHorizontal, Send, Check, CheckCheck, Search } from 'lucide-react';
import { MockConversation } from '@/types';
import Avatar from '@/components/ui/Avatar';

interface ChatPaneProps {
  conversation: MockConversation | null;
  onBack: () => void;
  onSendMessage: (conversationId: string, content: string) => void;
  className?: string;
}

export default function ChatPane({ conversation, onBack, onSendMessage, className = "" }: ChatPaneProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && conversation) {
      onSendMessage(conversation.id, message.trim());
      setMessage("");
    }
  };

  if (!conversation) {
    return (
      <div className={`flex flex-col items-center justify-center bg-white w-full h-full relative ${className}`}>
        <div className="flex flex-col items-center justify-center max-w-sm px-4 -mt-16">
          <div className="relative mb-6">
            {/* Dashed outer ring */}
            <svg width="100" height="100" viewBox="0 0 100 100" className="absolute -top-1 -left-1 text-blue-600 fill-none stroke-current stroke-[3px]" strokeDasharray="6 6">
              <circle cx="50" cy="50" r="48" />
            </svg>
            {/* Solid blue bubble with tail */}
            <svg width="92" height="92" viewBox="0 0 100 100" className="relative z-10 m-1">
              <path d="M50 5C25.147 5 5 25.147 5 50c0 8.353 2.274 16.166 6.184 22.956L5 95l22.044-6.184C33.834 92.726 41.647 95 50 95c24.853 0 45-20.147 45-45S74.853 5 50 5z" fill="#3A76F0" />
            </svg>
          </div>
          <h2 className="text-[22px] font-semibold text-gray-900 mb-2">Welcome to Signal</h2>
          <p className="text-gray-500 text-[14px]">
            See <span className="text-[#3A76F0] cursor-pointer hover:underline">what's new</span> in this update
          </p>
        </div>
        <div className="absolute bottom-6 text-[13px] text-gray-400">
          Signal is a 501c3 nonprofit
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white w-full h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100 z-10 h-[60px]">
        <div className="flex items-center">
          <button onClick={onBack} className="md:hidden mr-2 text-gray-600 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <Avatar url={conversation.avatar} name={conversation.name} size={36} />
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900 text-[16px] leading-tight">{conversation.name}</h3>
            {conversation.type === 'direct' && (
              <p className="text-[13px] text-gray-500 leading-tight">
                {conversation.isOnline ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 text-gray-600">
          <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"><Video size={20} /></button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"><Phone size={20} /></button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"><Search size={20} /></button>
          <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"><MoreHorizontal size={20} /></button>
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        
        {/* Intro Block */}
        <div className="flex flex-col items-center justify-center mt-12 mb-8">
          <div className="bg-white border border-gray-200 rounded-[24px] px-16 py-6 flex flex-col items-center">
             <div className="mb-2">
               <Avatar url={conversation.avatar} name={conversation.name} size={80} />
             </div>
             <h2 className="text-[18px] text-gray-900 mt-2 flex items-center gap-1 cursor-pointer hover:underline">
               {conversation.name}
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
             </h2>
             <div className="flex items-center gap-1 mt-1 text-[13px] text-gray-500">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
               No groups in common
             </div>
          </div>
        </div>

        <div className="flex justify-center my-6">
          <span className="text-[12px] text-gray-500 font-medium">Today</span>
        </div>
        
        <div className="flex justify-center my-4 mb-8">
          <div className="text-center text-[13px] text-gray-500 max-w-sm flex flex-col items-center gap-2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
             <span>Your message history with {conversation.name} and their number 099299 61431 has been merged.</span>
             <span className="text-[#3A76F0] font-medium cursor-pointer hover:underline">Learn More</span>
          </div>
        </div>

        {conversation.messages.map((msg, idx) => {
          const isMine = msg.senderId === 0;
          const showSenderName = conversation.type === 'group' && !isMine;
          
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && conversation.type === 'group' && (
                <div className="w-8 flex-shrink-0 mr-2 flex items-end mb-1">
                   <Avatar url={null} name={`User ${msg.senderId}`} size={28} />
                </div>
              )}
              <div 
                className={`max-w-[85%] md:max-w-[65%] rounded-[20px] px-3.5 py-2 ${
                  isMine 
                    ? 'bg-[#2C6BED] text-white rounded-br-sm' 
                    : 'bg-[#F2F2F2] text-gray-900 rounded-bl-sm'
                }`}
              >
                {showSenderName && (
                  <div className="text-[12px] font-semibold text-blue-600 mb-0.5">
                    User {msg.senderId}
                  </div>
                )}
                <p className="text-[15px] leading-[1.4] break-words whitespace-pre-wrap">{msg.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] font-medium ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                  {isMine && (
                    <span className="flex-shrink-0 ml-0.5">
                      {msg.status === 'read' && <CheckCheck size={14} className="text-white" />}
                      {msg.status === 'delivered' && <CheckCheck size={14} className="text-blue-100" />}
                      {msg.status === 'sent' && <Check size={14} className="text-blue-100" />}
                      {msg.status === 'sending' && <span className="opacity-70 text-[10px]">...</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="px-4 py-3 bg-white flex items-center gap-3">
        <button type="button" className="text-gray-500 hover:text-gray-700 flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
        </button>
        
        <form onSubmit={handleSend} className="flex-1 bg-[#F2F2F2] rounded-3xl flex items-center min-h-[44px] px-2 py-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            className="flex-1 bg-transparent border-none py-1.5 px-3 focus:outline-none text-gray-900 text-[15px] placeholder-gray-500"
          />
          {!message.trim() ? (
            <div className="flex items-center gap-1">
              <button type="button" className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-colors flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              </button>
              <button type="button" className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-colors flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSend}
              className="p-1.5 rounded-full bg-[#2C6BED] text-white hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm mx-1"
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
