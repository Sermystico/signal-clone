export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MockMessage {
  id: string;
  content: string;
  senderId: number; // 0 represents the current authenticated user
  timestamp: string;
  status?: MessageStatus;
}

export interface MockConversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  lastActivity: string;
  unreadCount: number;
  messages: MockMessage[];
  isOnline?: boolean;
}
