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
  lastSeen?: string;
  otherUserId?: number;
  phone?: string | null;
  username?: string | null;
  isTyping?: boolean;
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
}
