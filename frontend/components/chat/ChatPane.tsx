import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreHorizontal,
  Send,
  Check,
  CheckCheck,
  Search,
  ChevronRight,
  Users,
  User,
  Sparkles,
  UserCheck,
  UserPlus,
  UserMinus,
  X,
  Loader2,
} from 'lucide-react';
import { MockConversation } from '@/types';
import Avatar from '@/components/ui/Avatar';

interface ChatPaneProps {
  currentUserId: number;
  conversation: MockConversation | null;
  allConversations?: MockConversation[];
  onBack: () => void;
  onSendMessage: (conversationId: number | string, content: string) => void;
  onSendTyping?: (conversationId: number | string, isTyping: boolean) => void;
  onViewDetails?: () => void;
  isContact?: boolean;
  onToggleContact?: (userId: number, isCurrentlyContact: boolean) => Promise<void>;
  className?: string;
}

const ensureUTC = (ts: string) => (ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');

const formatLastSeen = (lastSeen?: string) => {
  if (!lastSeen) return 'Offline';
  const date = new Date(ensureUTC(lastSeen));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  if (diffDays === 1) return 'Last seen yesterday';
  if (diffDays < 7) return `Last seen ${diffDays}d ago`;

  return `Last seen ${date.toLocaleDateString()}`;
};

export default function ChatPane({
  currentUserId,
  conversation,
  allConversations = [],
  onBack,
  onSendMessage,
  onSendTyping,
  onViewDetails,
  isContact = false,
  onToggleContact,
  className = ''
}: ChatPaneProps) {
  const [message, setMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingSentRef = useRef(false);

  // Compute common groups for direct contact only
  const commonGroupNames = React.useMemo(() => {
    if (!conversation || conversation.type === 'group' || !conversation.otherUserId || !allConversations.length) {
      return [];
    }
    return allConversations
      .filter(
        (c) =>
          c.type === 'group' &&
          c.group?.members?.some((m) => m.user_id === conversation.otherUserId)
      )
      .map((c) => c.group?.name || c.name);
  }, [conversation, allConversations]);

  // Auto-scroll to bottom when messages or typing status change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [conversation?.messages, conversation?.isTyping]);

  // Clean up typing status when unmounting or changing conversations
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingSentRef.current && conversation) {
        onSendTyping?.(conversation.id, false);
        isTypingSentRef.current = false;
      }
    };
  }, [conversation?.id, onSendTyping]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);

    if (!conversation) return;

    if (val.trim()) {
      if (!isTypingSentRef.current) {
        onSendTyping?.(conversation.id, true);
        isTypingSentRef.current = true;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingSentRef.current) {
          onSendTyping?.(conversation.id, false);
          isTypingSentRef.current = false;
        }
      }, 2500);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingSentRef.current) {
        onSendTyping?.(conversation.id, false);
        isTypingSentRef.current = false;
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && conversation) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingSentRef.current) {
        onSendTyping?.(conversation.id, false);
        isTypingSentRef.current = false;
      }
      onSendMessage(conversation.id, message.trim());
      setMessage('');
    }
  };

  const handleContactAction = async () => {
    if (!conversation?.otherUserId || !onToggleContact || contactLoading) return;
    setContactLoading(true);
    try {
      await onToggleContact(conversation.otherUserId, isContact);
      setToastMessage(isContact ? 'Removed from contacts' : 'Added to contacts');
    } catch (err) {
      setToastMessage('Failed to update contact');
    } finally {
      setContactLoading(false);
    }
  };

  if (!conversation) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-white w-full h-full relative ${className}`}
      >
        <div className="flex flex-col items-center justify-center max-w-sm px-4 -mt-16">
          <div className="relative mb-6">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#2C6BED"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
              <path
                d="M50 12 C29.013 12 12 29.013 12 50 C12 56.5 13.6 62.6 16.5 67.9 L12 88 L32.1 83.5 C37.4 86.4 43.5 88 50 88 C70.987 88 88 70.987 88 50 C88 29.013 70.987 12 50 12 Z"
                fill="#2C6BED"
              />
            </svg>
          </div>
          <h2 className="text-[22px] font-semibold text-gray-900">Welcome to Signal</h2>
        </div>
        <div className="absolute bottom-6 text-[13px] text-gray-400">
          Signal is a 501c3 nonprofit
        </div>
      </div>
    );
  }

  // Sender lookup map for groups
  const memberMap = new Map<number, { name: string; avatar: string | null }>();
  if (conversation.type === 'group' && conversation.group?.members) {
    conversation.group.members.forEach(m => {
      memberMap.set(m.user_id, {
        name: m.user.display_name || m.user.username,
        avatar: m.user.avatar_url
      });
    });
  }

  return (
    <div className={`flex flex-col bg-white w-full h-full relative ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur-xs transition-all animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100 z-10 h-[60px]">
        <div
          className="flex items-center cursor-pointer min-w-0"
          onClick={() => {
            if (conversation.type === 'group' && onViewDetails) onViewDetails();
          }}
        >
          <button
            onClick={e => {
              e.stopPropagation();
              onBack();
            }}
            className="md:hidden mr-2 text-gray-600 p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <Avatar url={conversation.avatar} name={conversation.name} size={36} />
          <div className="ml-3 min-w-0">
            <h3 className="font-semibold text-gray-900 text-[16px] leading-tight truncate">
              {conversation.name}
            </h3>
            {conversation.type === 'direct' ? (
              <p
                className={`text-[13px] leading-tight truncate ${
                  conversation.isTyping ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {conversation.isTyping
                  ? 'typing...'
                  : conversation.isOnline
                  ? 'Online'
                  : formatLastSeen(conversation.lastSeen)}
              </p>
            ) : (
              <p className="text-[12px] text-gray-500 leading-tight">
                {conversation.group?.members?.length || 0} members
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-600 flex-shrink-0">
          <button
            type="button"
            onClick={() => setToastMessage('Video calls - Coming soon')}
            title="Video call (Coming soon)"
            aria-label="Start a video call"
            className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <Video size={20} />
          </button>
          <button
            type="button"
            onClick={() => setToastMessage('Voice calls - Coming soon')}
            title="Voice call (Coming soon)"
            aria-label="Start a call"
            className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <Phone size={20} />
          </button>
          <button
            type="button"
            onClick={() => setToastMessage('Search within conversation - Coming soon')}
            title="Search"
            aria-label="Search"
            className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <Search size={20} />
          </button>
          <button
            onClick={onViewDetails}
            title={conversation.type === 'group' ? 'Group Details & Members' : 'More info'}
            aria-label="More info"
            className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Messages View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {/* Intro Block: Simple clean info for group, or Interactive Contact Card with Arrow for Direct Chat */}
        {conversation.type === 'group' ? (
          <div className="flex flex-col items-center justify-center mt-8 mb-4">
            <Avatar
              url={conversation.avatar}
              name={conversation.name}
              size={56}
              className="mb-2 shadow-xs"
            />
            <h3 className="text-[17px] font-bold text-gray-900">{conversation.name}</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {conversation.group?.members?.length || 0} members
            </p>
            <div className="text-[12px] font-medium text-gray-400 mt-4">
              Yesterday
            </div>
          </div>
        ) : (
          <>
            {/* Direct Contact Intro Card (Matches Photo 1) */}
            <div className="flex flex-col items-center justify-center mt-10 mb-6">
              <div className="bg-white border border-gray-300/80 rounded-[28px] px-8 py-5 pt-8 relative flex flex-col items-center max-w-[270px] w-full shadow-2xs text-center">
                {/* Avatar overlapping top border */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                  <Avatar
                    url={conversation.avatar}
                    name={conversation.name}
                    size={54}
                    className="border-3 border-white shadow-xs"
                  />
                </div>

                {/* Name + Chevron Right (Click opens Photo 2 Popover) */}
                <button
                  type="button"
                  onClick={() => setShowContactPopup(true)}
                  className="flex items-center justify-center gap-1 text-[17px] font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer group mt-0.5"
                >
                  <span>{conversation.name}</span>
                  <ChevronRight size={17} className="text-gray-500 group-hover:text-blue-600 transition-colors stroke-[2.5]" />
                </button>

                {/* Subtitle: Member of <group names> / empty if none */}
                {commonGroupNames.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-[13px] text-gray-800 font-medium mt-1.5">
                    <Users size={14} className="text-gray-600 flex-shrink-0" />
                    <span>
                      Member of <strong>{commonGroupNames.join(', ')}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Date separator underneath card */}
              <div className="text-[12px] font-medium text-gray-400 mt-5">
                Yesterday
              </div>
            </div>

            {/* Contact Status Notice (Text-only notice in main chat; disappears when added to contacts) */}
            {!isContact && (
              <div className="flex justify-center my-2.5 px-4">
                <div className="flex items-center gap-2 bg-gray-100/90 text-gray-600 border border-gray-200/80 rounded-full px-4 py-1.5 shadow-2xs">
                  <UserPlus size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="text-[12.5px] font-medium leading-tight">
                    This person is not in your contact list
                  </span>
                </div>
              </div>
            )}

            {/* Direct Contact Details Popover (Matches Photo 2) */}
            {showContactPopup && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs px-4 animate-in fade-in duration-150"
                onClick={() => setShowContactPopup(false)}
              >
                <div
                  className="bg-white rounded-[28px] p-6 max-w-[320px] w-full shadow-2xl relative border border-gray-100 flex flex-col items-center animate-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setShowContactPopup(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  {/* Big Center Avatar */}
                  <div className="mt-2 mb-5">
                    <Avatar
                      url={conversation.avatar}
                      name={conversation.name}
                      size={136}
                      className="shadow-xs border-2 border-white"
                    />
                  </div>

                  {/* Info Card List */}
                  <div className="w-full bg-white border border-gray-200/90 rounded-2xl p-2 space-y-0.5 shadow-2xs">
                    {/* Row 1: Name */}
                    <div className="flex items-center gap-3 px-3 py-2 text-[14px] font-medium text-gray-900">
                      <User size={16} className="text-gray-600 flex-shrink-0" />
                      <span className="truncate">{conversation.name}</span>
                    </div>

                    {/* Row 2: Signal Connection */}
                    <div className="flex items-center justify-between px-3 py-2 text-[14px] font-medium text-gray-900 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <Sparkles size={16} className="text-gray-600 flex-shrink-0" />
                        <span>Signal Connection</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>

                    {/* Row 3: System contacts */}
                    <div
                      onClick={handleContactAction}
                      className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-medium hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    >
                      {isContact ? (
                        <UserMinus size={16} className="text-red-500 flex-shrink-0" />
                      ) : (
                        <UserCheck size={16} className="text-gray-600 flex-shrink-0" />
                      )}
                      <span className={`truncate flex-1 ${isContact ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}`}>
                        {isContact
                          ? `Remove ${conversation.name} from contacts`
                          : `Add ${conversation.name} to contacts`}
                      </span>
                      {contactLoading && <Loader2 size={13} className="animate-spin text-gray-500" />}
                    </div>

                    {/* Row 4: Phone Number */}
                    <div className="flex items-center gap-3 px-3 py-2 text-[14px] font-medium text-gray-900">
                      <Phone size={16} className="text-gray-600 flex-shrink-0" />
                      <span className="truncate">{conversation.phone || '099299 61431'}</span>
                    </div>

                    {/* Row 5: Member of <group names> / empty if none */}
                    {commonGroupNames.length > 0 && (
                      <div className="flex items-center gap-3 px-3 py-2 text-[14px] font-medium text-gray-900">
                        <Users size={16} className="text-gray-600 flex-shrink-0" />
                        <span className="truncate">
                          Member of <strong>{commonGroupNames.join(', ')}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-center my-4">
          <span className="text-[12px] text-gray-400 font-medium">Messages are end-to-end encrypted</span>
        </div>

        {/* Message items */}
        {conversation.messages.map(msg => {
          const isMine = msg.senderId === currentUserId;
          const showSenderName = conversation.type === 'group' && !isMine;
          const senderInfo = memberMap.get(msg.senderId);
          const senderDisplayName = senderInfo?.name || `User ${msg.senderId}`;
          const senderAvatar = senderInfo?.avatar || null;

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && conversation.type === 'group' && (
                <div className="w-8 flex-shrink-0 mr-2 flex items-end mb-1">
                  <Avatar url={senderAvatar} name={senderDisplayName} size={28} />
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[65%] rounded-2xl px-3.5 py-2 shadow-2xs ${
                  isMine
                    ? 'bg-[#2C6BED] text-white rounded-br-xs'
                    : 'bg-[#F2F2F2] text-gray-900 rounded-bl-xs'
                }`}
              >
                {showSenderName && (
                  <div className="text-[12px] font-semibold text-blue-600 mb-0.5">
                    {senderDisplayName}
                  </div>
                )}
                <p className="text-[15px] leading-[1.4] break-words whitespace-pre-wrap">
                  {msg.content}
                </p>
                <div
                  className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] font-medium ${
                    isMine ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  <span>
                    {new Date(ensureUTC(msg.timestamp)).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                  {isMine && (
                    <span className="flex-shrink-0 ml-0.5">
                      {msg.status === 'read' && <CheckCheck size={14} className="text-white" />}
                      {msg.status === 'delivered' && (
                        <CheckCheck size={14} className="text-blue-200" />
                      )}
                      {msg.status === 'sent' && <Check size={14} className="text-blue-200" />}
                      {msg.status === 'sending' && (
                        <span className="opacity-70 text-[10px]">...</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {conversation.isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#F2F2F2] rounded-2xl rounded-bl-xs px-4 py-2.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="px-4 py-3 bg-white flex items-center gap-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setToastMessage('File attachments - Coming soon')}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
          title="Add files (Coming soon)"
          aria-label="Add files"
        >
          {/* Plus / Add files icon */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <form
          onSubmit={handleSend}
          className="flex-1 bg-[#F2F2F2] rounded-3xl flex items-center min-h-[44px] px-2 py-1"
        >
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Message"
            className="flex-1 bg-transparent border-none py-1.5 px-3 focus:outline-none text-gray-900 text-[15px] placeholder-gray-500"
          />
          {!message.trim() ? (
            <div className="flex items-center gap-1">
              {/* Emoji / Stickers button */}
              <button
                type="button"
                onClick={() => setToastMessage('Emoji & Stickers - Coming soon')}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-colors flex-shrink-0 cursor-pointer"
                title="Emoji & Stickers (Coming soon)"
                aria-label="Emoji & Stickers"
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </button>

              {/* Voice message / Mic button */}
              <button
                type="button"
                onClick={() => setToastMessage('Voice notes - Coming soon')}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-colors flex-shrink-0 cursor-pointer"
                title="Voice note (Coming soon)"
                aria-label="Voice note"
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
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={handleSend}
              className="p-2 rounded-full bg-[#2C6BED] text-white hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm mx-1 cursor-pointer"
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
