'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { MessageCircle, X, Send, Circle } from 'lucide-react';
import axios from 'axios';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface Conversation {
  _id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function ChatPanel() {
  const { socket, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  const loadConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data);
      
      // Calculate total unread
      const total = response.data.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
      setTotalUnread(total);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages with specific user
  const loadMessages = async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/chat/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);

      // Mark as read
      await axios.put(
        `${API_URL}/chat/read/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Reload conversations to update unread count
      loadConversations();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('newMessage', (message: Message) => {
      if (
        selectedUser &&
        (message.sender._id === selectedUser._id || message.receiver._id === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, message]);

        // Mark as read if chat is open
        if (message.sender._id === selectedUser._id) {
          axios.put(
            `${API_URL}/chat/read/${selectedUser._id}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      // Reload conversations
      loadConversations();
    });

    // Listen for sent message confirmation
    socket.on('messageSent', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for user online/offline
    socket.on('userOnline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    socket.on('userOffline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Listen for typing indicators
    socket.on('userTyping', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(userId));
    });

    socket.on('userStopTyping', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.off('newMessage');
      socket.off('messageSent');
      socket.off('userOnline');
      socket.off('userOffline');
      socket.off('userTyping');
      socket.off('userStopTyping');
    };
  }, [socket, selectedUser]);

  // Load conversations on open
  useEffect(() => {
    if (isOpen && token) {
      loadConversations();
    }
  }, [isOpen]);

  // Handle typing
  const handleTyping = () => {
    if (!socket || !selectedUser) return;

    socket.emit('typing', { receiverId: selectedUser._id });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { receiverId: selectedUser._id });
    }, 2000);
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!socket || !selectedUser || !newMessage.trim()) return;

    socket.emit('sendMessage', {
      receiverId: selectedUser._id,
      message: newMessage.trim(),
    });

    setNewMessage('');

    // Stop typing
    socket.emit('stopTyping', { receiverId: selectedUser._id });
  };

  // Select user to chat with
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    loadMessages(user._id);
  };

  if (!isConnected) {
    return null; // Don't show chat if not connected
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50 transition-all"
      >
        <MessageCircle size={24} />
        {totalUnread > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-semibold text-lg">Messages</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 rounded p-1">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* User List */}
            {!selectedUser ? (
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y dark:divide-gray-700">
                    {conversations.map((conv) => (
                      <div
                        key={conv._id}
                        onClick={() => handleSelectUser(conv.user)}
                        className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {conv.user.name.charAt(0).toUpperCase()}
                            </div>
                            {onlineUsers.has(conv.user._id) && (
                              <Circle
                                size={12}
                                className="absolute bottom-0 right-0 fill-green-500 text-green-500"
                              />
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {conv.user.name}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {conv.lastMessage.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Chat View */
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-3 border-b dark:border-gray-700 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    ←
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    {onlineUsers.has(selectedUser._id) && (
                      <Circle
                        size={10}
                        className="absolute bottom-0 right-0 fill-green-500 text-green-500"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p>
                    {onlineUsers.has(selectedUser._id) ? (
                      <p className="text-xs text-green-600">Online</p>
                    ) : (
                      <p className="text-xs text-gray-500">Offline</p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.sender._id === currentUser.id || msg.sender._id === currentUser._id;

                    return (
                      <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {typingUsers.has(selectedUser._id) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">Typing...</p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg px-4 py-2 transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
