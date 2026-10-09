export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MockMessage {
  id: number | string;
  content: string;
  senderId: number; // 0 represents the current authenticated user
  timestamp: string;
  status?: MessageStatus;
}

export interface MockConversation {
  id: number | string;
  type: 'direct' | 'group';
  name: string;
  avatar?: string | null;
  lastActivity: string;
  unreadCount: number;
  messages: MockMessage[];
  isOnline?: boolean;
  otherUserId?: number;
}
