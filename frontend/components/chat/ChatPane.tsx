import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Send, Check, CheckCheck } from 'lucide-react';
import { MockConversation } from '@/types';

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
      <div className={`flex flex-col items-center justify-center bg-gray-50 w-full h-full ${className}`}>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-light text-gray-600 mb-2">Signal Clone for Web</h2>
          <p className="text-gray-500 text-sm">
            Send and receive messages seamlessly. Select a conversation to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#E6EBEB] w-full h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={onBack} className="md:hidden mr-3 text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <img src={conversation.avatar} alt={conversation.name} className="w-10 h-10 rounded-full object-cover" />
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{conversation.name}</h3>
            <p className="text-xs text-gray-500">
              {conversation.isOnline ? "Online" : `Last seen ${new Date(conversation.lastActivity).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-gray-500">
          <button className="hover:text-gray-700"><Phone size={20} /></button>
          <button className="hover:text-gray-700"><Video size={20} /></button>
          <button className="hover:text-gray-700"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((msg) => {
          const isMine = msg.senderId === 0;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 shadow-sm ${
                  isMine 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white text-gray-900 rounded-bl-sm'
                }`}
              >
                <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && msg.status === 'read' && <CheckCheck size={14} className="text-blue-200" />}
                  {isMine && msg.status === 'delivered' && <CheckCheck size={14} />}
                  {isMine && msg.status === 'sent' && <Check size={14} />}
                  {isMine && msg.status === 'sending' && <span className="opacity-70">...</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button type="button" className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message"
            className="flex-1 bg-white border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:border-blue-500 text-gray-900"
          />
          <button 
            type="submit" 
            disabled={!message.trim()}
            className={`p-2 rounded-full transition-colors ${message.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
