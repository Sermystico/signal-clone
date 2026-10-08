import { MockConversation } from '../types';

// Mock data for Phase 3 UI shell
export const mockConversations: MockConversation[] = [
  {
    id: "c1",
    type: "direct",
    name: "Alice Smith",
    lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: "m1",
        content: "Hey, are we still meeting today?",
        senderId: 1, 
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      },
      {
        id: "m2",
        content: "I have the designs ready.",
        senderId: 1,
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      }
    ]
  },
  {
    id: "c2",
    type: "direct",
    name: "Bob Jones",
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: "m3",
        content: "Thanks for the update!",
        senderId: 0, // 0 represents current user
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: "read"
      }
    ]
  },
  {
    id: "c3",
    type: "group",
    name: "Secret Agents",
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    unreadCount: 0,
    messages: [
      {
        id: "m4",
        content: "Welcome to the group everyone!",
        senderId: 2,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      }
    ]
  }
];
