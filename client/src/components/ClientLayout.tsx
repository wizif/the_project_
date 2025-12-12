'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Circle, User } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar?: string;
  };
  message: string;
  createdAt: string;
}

interface UserType {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUser = mounted ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const token = mounted ? localStorage.getItem('token') : null;

  // Initialize Socket.io
  useEffect(() => {
    if (!token || !mounted) return;

    console.log('🔌 Connecting to socket...', SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket Connected!');
      setSocket(socketInstance);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket Error:', error.message);
    });

    // ✅ FIX: Receive initial list of online users
    socketInstance.on('onlineUsersList', ({ userIds }: { userIds: string[] }) => {
      console.log('📋 Online users list received:', userIds);
      setOnlineUsers(new Set(userIds));
    });

    // User comes online
    socketInstance.on('userOnline', ({ userId }: { userId: string }) => {
      console.log('👤 User online:', userId);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
    });

    // User goes offline
    socketInstance.on('userOffline', ({ userId }: { userId: string }) => {
      console.log('👤 User offline:', userId);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socketInstance.on('newMessage', (message: Message) => {
      console.log('📩 New message received:', message);
      if (selectedUser && message.sender._id === selectedUser._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socketInstance.on('messageSent', (message: Message) => {
      console.log('✅ Message sent:', message);
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      console.log('🔌 Disconnecting socket...');
      socketInstance.disconnect();
    };
  }, [token, mounted, selectedUser]);

  // Load all users
  const loadUsers = async () => {
    console.log('📥 Loading users...');
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Users loaded:', response.data);
      const filteredUsers = response.data.filter((u: UserType) => u._id !== currentUser.id && u._id !== currentUser._id);
      setUsers(filteredUsers);
    } catch (error: any) {
      console.error('❌ Error loading users:', error.response?.data || error.message);
    }
  };

  // Load messages
  const loadMessages = async (userId: string) => {
    console.log('📥 Loading messages for user:', userId);
    try {
      const response = await axios.get(`${API_URL}/chat/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Messages loaded:', response.data);
      setMessages(response.data);
    } catch (error: any) {
      console.error('❌ Error loading messages:', error.response?.data || error.message);
    }
  };

  // Open chat
  const handleOpenChat = () => {
    console.log('💬 Opening chat panel...');
    setIsOpen(true);
    if (users.length === 0) {
      loadUsers();
    }
  };

  // Select user
  const handleSelectUser = (user: UserType) => {
    console.log('👤 Selected user:', user);
    setSelectedUser(user);
    loadMessages(user._id);
  };

  // Send message function
  const sendMessage = () => {
    if (!socket || !selectedUser || !newMessage.trim()) return;

    console.log('📤 Sending message to:', selectedUser.name);
    socket.emit('sendMessage', {
      receiverId: selectedUser._id,
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  // Send message on form submit
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Send message on Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Avatar component
  const UserAvatar = ({ user, size = 'md' }: { user: UserType; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'w-10 h-10 text-sm',
      md: 'w-12 h-12 text-base',
      lg: 'w-16 h-16 text-xl',
    };

    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white font-semibold`}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <span>{user.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
    );
  };

  if (!mounted || !token) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Chat Button */}
      <button
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-50 transition-all"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-semibold text-lg">Chat</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 rounded p-1">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          {!selectedUser ? (
            /* User List */
            <div className="flex-1 overflow-y-auto">
              {users.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Loading users...</p>
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {users.map((user) => {
                    const isOnline = onlineUsers.has(user._id);
                    return (
                      <div
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                        className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <UserAvatar user={user} size="md" />
                            {isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                              {isOnline && (
                                <span className="text-xs text-green-600 font-medium">● Online</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Chat View */
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-3 border-b dark:border-gray-700 flex items-center gap-3 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  ← Back
                </button>
                <div className="relative">
                  <UserAvatar user={selectedUser} size="sm" />
                  {onlineUsers.has(selectedUser._id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p>
                  {onlineUsers.has(selectedUser._id) ? (
                    <p className="text-xs text-green-600 font-medium">● Online</p>
                  ) : (
                    <p className="text-xs text-gray-500">○ Offline</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Say hi! 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender._id === currentUser.id || msg.sender._id === currentUser._id;
                    return (
                      <div key={msg._id} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && msg.sender.avatar && (
                          <img src={msg.sender.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border dark:border-gray-700'
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
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message... (Press Enter to send)"
                    className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
