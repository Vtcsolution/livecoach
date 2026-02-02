import React, { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  ArrowLeft,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Sparkles,
  Shield,
  Star,
  RefreshCw,
  Check,
  CheckCheck,
  Clock,
  Smile,
  Paperclip,
  Mic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePsychicAuth } from "../context/PsychicAuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { toast } from "sonner";

// ========== UTILITY FUNCTIONS ==========
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 168) {
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

const formatLastMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase().replace(' ', '');
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else if ((now - date) / (1000 * 60 * 60 * 24) < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

const formatMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(':', '.');
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'sent':
      return <Check className="h-3 w-3" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

const PsychicChats = () => {
  const { psychic, loading: authLoading, isAuthenticated, logout } = usePsychicAuth();
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showChatList, setShowChatList] = useState(!isMobileView);
  
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const selectedSessionRef = useRef(null);
  const isMountedRef = useRef(true);

  const chatApi = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    timeout: 10000,
  });

  chatApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('psychicToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  // Mobile view check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      setShowChatList(!mobile || !selectedSession);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedSession]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/psychic/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/message_ring.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch chat sessions
  const fetchChats = useCallback(async () => {
    if (!psychic || !isAuthenticated) return;
    setRefreshing(true);
    setError(null);
    try {
      const { data } = await chatApi.get('/api/psychic/sessions');
      if (data.success && isMountedRef.current) {
        setChatSessions(data.chatSessions || []);
      } else {
        throw new Error(data.message || "Failed to load chats");
      }
    } catch (err) {
      console.error("Fetch chats error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load chats");
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
        navigate("/psychic/login");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [psychic, isAuthenticated, navigate, logout]);

  // Initial fetch
  useEffect(() => {
    if (psychic && isAuthenticated && isMountedRef.current) {
      fetchChats();
    }
  }, [psychic, isAuthenticated, fetchChats]);

  // SOCKET.IO SETUP
  useEffect(() => {
    if (!psychic || !isAuthenticated || !isMountedRef.current) return;
    const token = localStorage.getItem("psychicToken");
    if (!token) {
      toast.error("No authentication token found");
      logout();
      navigate("/psychic/login");
      return;
    }

    socketRef.current = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5001', {
      auth: {
        token: token,
        userId: psychic._id,
        role: 'psychic'
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    // SOCKET EVENT HANDLERS
    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected as psychic:", psychic.name);
      socketRef.current.emit('join_room', `psychic_${psychic._id}`);
      
      // Join all existing chat rooms
      if (chatSessions.length > 0) {
        chatSessions.forEach(session => {
          socketRef.current.emit('join_room', `chat_${session._id}`);
        });
      }
    });

    // NEW MESSAGE HANDLER - FIXED
    socketRef.current.on('new_message', (data) => {
      console.log('📩 New message received via socket:', data);
      const { message, chatSessionId, senderId, senderRole } = data;
      
      // Only handle messages from user
      if (senderRole !== 'user') {
        console.log("Ignoring message from non-user (probably own message)");
        return;
      }
      
      // Play notification sound
      if (senderId.toString() !== psychic._id.toString() && audioRef.current) {
        audioRef.current.play().catch(err => console.log('Audio play error:', err));
      }
      
      // If message is for current session, add to messages
      if (chatSessionId === selectedSessionRef.current?._id) {
        console.log("Adding message to current session messages");
        setMessages(prev => {
          const currentMsgs = prev[chatSessionId] || [];
          if (!currentMsgs.some(m => m._id === message._id)) {
            return {
              ...prev,
              [chatSessionId]: [...currentMsgs, message]
            };
          }
          return prev;
        });
        
        // Mark as read
        socketRef.current.emit('message_read', {
          messageId: message._id,
          chatSessionId
        });
      }
      
      // Update chat session list with new message
      setChatSessions(prev => {
        const sessionExists = prev.find(s => s._id === chatSessionId);
        
        if (!sessionExists) {
          // Create new session
          const newSession = {
            _id: chatSessionId,
            user: {
              _id: message.sender?._id,
              firstName: message.sender?.name?.split(' ')[0] || 'User',
              lastName: message.sender?.name?.split(' ')[1] || '',
              image: message.sender?.image,
            },
            psychic: psychic._id,
            lastMessage: message,
            lastMessageAt: new Date(),
            unreadCounts: {
              user: 0,
              psychic: 1
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return [newSession, ...prev];
        }
        
        return prev.map(session => {
          if (session._id === chatSessionId) {
            const isSelected = selectedSessionRef.current?._id === chatSessionId;
            return {
              ...session,
              lastMessage: message,
              lastMessageAt: new Date(),
              unreadCounts: {
                ...session.unreadCounts,
                psychic: isSelected ? 0 : (session.unreadCounts?.psychic || 0) + 1
              }
            };
          }
          return session;
        });
      });
      
      // Show notification if not viewing this chat
      if (chatSessionId !== selectedSessionRef.current?._id) {
        toast.info(`New message from user`);
      }
    });

    // Typing indicator
    socketRef.current.on('typing_indicator', ({ chatSessionId, isTyping }) => {
      if (chatSessionId === selectedSessionRef.current?._id) {
        setIsTyping(isTyping);
      }
    });

    // New chat session
    socketRef.current.on('new_chat_session', (data) => {
      console.log('🎯 New chat session received:', data);
      const { chatSession } = data;
      audioRef.current.play().catch(err => console.log("Audio play error:", err));
      
      setChatSessions(prev => {
        const exists = prev.find(s => s._id === chatSession._id);
        if (exists) {
          return prev.map(s => s._id === chatSession._id ? chatSession : s);
        }
        return [chatSession, ...prev];
      });
      
      toast.success(`New chat request from ${chatSession.user?.firstName || 'User'}`);
      
      // Join the chat room
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_room', `chat_${chatSession._id}`);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [psychic, isAuthenticated, chatSessions, navigate, logout]);

  // Fetch messages for selected session
  const fetchMessages = useCallback(async (sessionId) => {
    if (!sessionId || !psychic || !isAuthenticated) return;
    try {
      const { data } = await chatApi.get(`/api/psychic/messages/${sessionId}`);
      if (data.success && isMountedRef.current) {
        setMessages(prev => ({
          ...prev,
          [sessionId]: data.messages || []
        }));
        await chatApi.put(`/api/psychic/messages/${sessionId}/read`);
        setChatSessions(prev =>
          prev.map(session =>
            session._id === sessionId
              ? { ...session, unreadCounts: { ...session.unreadCounts, psychic: 0 } }
              : session
          )
        );
        
        // Join chat room
        if (socketRef.current?.connected) {
          socketRef.current.emit('join_room', `chat_${sessionId}`);
        }
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }, [psychic, isAuthenticated]);

  // Fetch messages when session is selected
  useEffect(() => {
    if (selectedSession && isMountedRef.current) {
      fetchMessages(selectedSession._id);
    }
  }, [selectedSession, fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current && isMountedRef.current) {
      setTimeout(() => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
          const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        }
      }, 100);
    }
  }, [messages[selectedSession?._id], isTyping]);

  // Filter sessions
  const filteredSessions = chatSessions.filter((session) => {
    const userName = `${session.user?.firstName || ''} ${session.user?.lastName || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return userName.includes(query);
  });

  // Select chat session
  const handleSelectSession = (session) => {
    setSelectedSession(session);
    if (isMobileView) {
      setShowChatList(false);
    }
  };

  // Back to chat list on mobile
  const handleBackToChatList = () => {
    if (isMobileView) {
      setShowChatList(true);
      setSelectedSession(null);
    }
  };

  // SEND MESSAGE - CRITICAL FIX
  const handleSend = async () => {
    const messageContent = input.trim();
    if (!messageContent || !selectedSession || !psychic || !socketRef.current?.connected) {
      return;
    }

    try {
      const { data } = await chatApi.post('/api/psychic/messages', {
        chatSessionId: selectedSession._id,
        content: messageContent,
        messageType: "text",
      });

      if (data.success && data.message) {
        const newMessage = data.message;
        
        // Add message to state IMMEDIATELY
        setMessages(prev => ({
          ...prev,
          [selectedSession._id]: [...(prev[selectedSession._id] || []), newMessage],
        }));

        // Update session list
        setChatSessions(prev =>
          prev.map(session =>
            session._id === selectedSession._id
              ? {
                  ...session,
                  lastMessage: newMessage,
                  lastMessageAt: new Date(),
                }
              : session
          )
        );

        // Clear input
        setInput("");

        // Stop typing indicator
        socketRef.current.emit("typing", {
          chatSessionId: selectedSession._id,
          isTyping: false
        });

        // EMIT SOCKET EVENT FOR REAL-TIME DELIVERY
        socketRef.current.emit("send_message", {
          chatSessionId: selectedSession._id,
          message: newMessage,
          senderId: psychic._id,
          senderRole: 'psychic'
        });

        console.log("📤 Message sent via socket");

        // Focus input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (selectedSession && socketRef.current?.connected) {
      socketRef.current.emit("typing", {
        chatSessionId: selectedSession._id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchChats();
    if (selectedSession) {
      fetchMessages(selectedSession._id);
    }
  };

  // Loading state
  if (authLoading || (loading && !refreshing)) {
    return (
      <div className="fixed inset-0 bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentMessages = messages[selectedSession?._id] || [];
  const selectedUser = selectedSession?.user || null;

  return (
    <div className="h-screen bg-[#f0f2f5] overflow-hidden">
      <div className="flex h-full">
        {/* Chat List Sidebar */}
        <div className={cn(
          "flex flex-col w-full md:w-96 bg-white border-r border-[#e9edef] transition-all duration-300 ease-in-out h-full",
          showChatList ? "flex" : "hidden md:flex"
        )}>
          <div className="p-4 bg-[#f0f2f5]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src={psychic?.image} />
                  <AvatarFallback className="bg-[#2A4A9C] text-white">
                    {psychic?.name?.[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-semibold text-gray-800">{psychic?.name}</h1>
                  <p className="text-xs text-gray-500">Psychic</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-10 w-10 text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-gray-300 focus:border-[#00a884] rounded-lg text-sm"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1 bg-white">
            <div className="p-1">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-[#f5f6f6] flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No chats yet</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session._id}
                    onClick={() => handleSelectSession(session)}
                    className={cn(
                      "flex items-center p-3 hover:bg-[#f5f6f6] cursor-pointer border-b border-[#f0f2f5]",
                      selectedSession?._id === session._id && "bg-[#f0f2f5]"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={session.user?.image} />
                        <AvatarFallback className="bg-[#2A4A9C] text-white font-medium">
                          {session.user?.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  
                    <div className="flex-1 min-w-0 ml-3">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">
                          {session.user?.firstName} {session.user?.lastName}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatLastMessageTime(session.lastMessageAt)}
                        </span>
                      </div>
                    
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate max-w-[180px]">
                          {session.lastMessage?.content || "No messages yet"}
                        </p>
                        {session.unreadCounts?.psychic > 0 && (
                          <span className="bg-[#00a884] text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                            {session.unreadCounts.psychic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Main Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-[#efeae2] bg-chat-pattern transition-all duration-300 ease-in-out h-full",
          !showChatList ? "flex" : "hidden md:flex"
        )}>
          {selectedSession ? (
            <div className="flex flex-col h-full">
              <div className="bg-white border-b border-[#e9edef] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMobileView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBackToChatList}
                        className="md:hidden text-gray-600 hover:text-gray-900"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser?.image} />
                      <AvatarFallback className="bg-[#2A4A9C] text-white">
                        {selectedUser?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {selectedUser?.firstName} {selectedUser?.lastName}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              
              <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <div className="space-y-2 max-w-3xl mx-auto">
                    {currentMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-sm">
                          <Sparkles className="h-8 w-8 text-[#00a884]" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Start a conversation
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          Send your first message to {selectedUser?.firstName}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center my-4">
                          <span className="bg-[#e1f5d5] text-gray-600 text-xs px-3 py-1 rounded-full">
                            Today
                          </span>
                        </div>
                        {currentMessages.map((msg, index) => {
                          const isPsychic = msg.senderModel === 'Psychic';
                          const showTime = index === currentMessages.length - 1 ||
                                         currentMessages[index + 1]?.senderModel !== msg.senderModel;
                        
                          return (
                            <div
                              key={msg._id}
                              className={cn(
                                "flex",
                                isPsychic ? "justify-end" : "justify-start"
                              )}
                            >
                              <div className="max-w-[65%]">
                                <div
                                  className={cn(
                                    "px-3 py-2 rounded-lg relative",
                                    isPsychic
                                      ? "bg-[#d9fdd3] rounded-br-none"
                                      : "bg-white rounded-bl-none shadow-sm"
                                  )}
                                >
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                                
                                  {showTime && (
                                    <div className={cn(
                                      "flex items-center gap-1 mt-1 text-xs",
                                      isPsychic ? "justify-end" : "justify-start"
                                    )}>
                                      <span className="text-gray-500">
                                        {formatMessageTime(msg.createdAt)}
                                      </span>
                                      {isPsychic && (
                                        <span className="ml-1">
                                          {getStatusIcon(msg.status)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-white px-3 py-2 rounded-lg rounded-bl-none shadow-sm max-w-[120px]">
                              <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </div>
              </ScrollArea>
              
              <div className="bg-[#f0f2f5] p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-500 hover:text-gray-700"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-500 hover:text-gray-700"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder="Type a message"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="h-12 pl-4 pr-12 bg-white border-none rounded-full focus-visible:ring-0"
                    />
                  </div>
                
                  {input.trim() ? (
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="h-12 w-12 rounded-full bg-[#2A4A9C]"
                    >
                      <Send className="h-5 w-5 text-white" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 text-gray-500 hover:text-gray-700"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#efeae2] bg-chat-pattern">
              <div className="max-w-md text-center px-4">
                <div className="mx-auto h-24 w-24 rounded-full bg-white/80 flex items-center justify-center mb-6 shadow-lg">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#00a884]/20 to-[#5ba4f3]/10 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-[#00a884]" />
                  </div>
                </div>
                <h1 className="text-3xl font-light text-gray-700 mb-2">
                  Psychic Chat
                </h1>
                <p className="text-gray-500 mb-8 text-base">
                  {chatSessions.length === 0
                    ? "Send and receive messages with your clients"
                    : "Select a chat to start messaging"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PsychicChats;


import React, { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Send,
  ArrowLeft,
  Search,
  MoreVertical,
  Phone,
  Video,
  Sparkles,
  Shield,
  Star,
  Check,
  CheckCheck,
  Clock,
  Smile,
  Paperclip,
  Mic,
  Wallet,
  DollarSign,
  AlertCircle,
  CreditCard,
  Zap,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "@/All_Components/screen/AuthContext";
import { toast } from "sonner";
import ChatRequestModal from "./ChatRequestModal";

// ========== UTILITY FUNCTIONS ==========
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

const formatLastMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase().replace(' ', '');
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else if ((now - date) / (1000 * 60 * 60 * 24) < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

const formatMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(':', '.');
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'sent':
      return <Check className="h-3 w-3" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

const formatCountdown = (seconds) => {
  if (!seconds || seconds <= 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export default function ChatInterface() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChatList, setShowChatList] = useState(!isMobileView);
  
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const selectedSessionRef = useRef(null);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [pendingSession, setPendingSession] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userCredits, setUserCredits] = useState(0);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [pendingAcceptedRequest, setPendingAcceptedRequest] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  const chatApi = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
    timeout: 10000,
  });

  chatApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Mobile view check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      setShowChatList(!mobile || !selectedSession);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedSession]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/psychic/login");
    }
  }, [authLoading, user, navigate]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/message_ring.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update selectedSessionRef
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  // Fetch user wallet balance
  const fetchUserWallet = useCallback(async () => {
    if (!user) return;
    try {
      const response = await chatApi.get('/api/chatrequest/wallet/balance');
      if (response.data.success) {
        const wallet = response.data.wallet;
        setUserBalance(wallet?.balance || 0);
        setUserCredits(wallet?.credits || 0);
        console.log('💰 Wallet fetched:', wallet);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  }, [user]);

  // Start local timer
  const startLocalTimer = (initialSeconds) => {
    clearLocalTimer();
    if (initialSeconds <= 0) return;
    const interval = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerIntervalRef.current = interval;
  };

  // Clear local timer
  const clearLocalTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Calculate allowed minutes
  const calculateAllowedMinutes = (ratePerMin) => {
    if (!ratePerMin || ratePerMin <= 0) return 0;
    return Math.floor(userCredits / ratePerMin);
  };

  const selectedPsychic = selectedSession?.psychic || null;
  const allowedMinutes = calculateAllowedMinutes(selectedPsychic?.ratePerMin || 0);
  const requiredForOneMinute = selectedPsychic?.ratePerMin || 0;
  const missingAmount = Math.max(0, requiredForOneMinute - userCredits);

  // Check for active chat request
  const checkActiveChatRequest = useCallback(async () => {
    if (!user) return;
    try {
      setSessionLoading(true);
      const response = await chatApi.get('/api/chatrequest/active-session');
      if (response.data.success && response.data.data) {
        const session = response.data.data;
        if (session.status === 'active') {
          console.log('✅ Found active session:', session);
          setActiveSession(session);
          if (session.paidSession?.remainingSeconds) {
            console.log('⏰ Setting countdown from active session:', session.paidSession.remainingSeconds);
            setCountdownSeconds(session.paidSession.remainingSeconds);
            startLocalTimer(session.paidSession.remainingSeconds);
          }
        } else if (session.status === 'accepted') {
          setPendingAcceptedRequest(session);
        }
        setChatSessions(prev => prev.map(s =>
          s.psychic?._id === session.psychic?._id ? { ...s, chatRequest: session } : s
        ));
      } else {
        console.log('❌ No active session found');
        setActiveSession(null);
        setPendingAcceptedRequest(null);
        setCountdownSeconds(0);
        clearLocalTimer();
      }
    } catch (error) {
      console.error("Error checking active chat request:", error);
      setActiveSession(null);
      setPendingAcceptedRequest(null);
      setCountdownSeconds(0);
      clearLocalTimer();
    } finally {
      setSessionLoading(false);
    }
  }, [user]);

  // Check for pending request with selected psychic
  const checkPendingRequest = useCallback(async () => {
    if (!selectedSession?.psychic?._id || !user) return;
    try {
      const response = await chatApi.get(`/api/chatrequest/pending/${selectedSession.psychic._id}`);
      if (response.data.success && response.data.data) {
        setPendingSession(response.data.data);
      } else {
        setPendingSession(null);
      }
    } catch (error) {
      console.error("Error checking pending request:", error);
      setPendingSession(null);
    }
  }, [user, selectedSession]);

  // Handle chat request sent
  const handleRequestSent = async (requestData) => {
    console.log('Chat request sent:', requestData);
    setPendingSession(requestData);
    await fetchUserWallet();
    await checkPendingRequest();
    toast.success("Chat request sent successfully!");
  };

  // Handle session end
  const handleSessionEnd = async (sessionData) => {
    console.log('Session ended:', sessionData);
    try {
      const response = await chatApi.post('/api/chatrequest/stop-timer', {
        requestId: activeSession?._id
      });
      if (response.data.success) {
        setActiveSession(null);
        setCountdownSeconds(0);
        clearLocalTimer();
        await fetchUserWallet();
        toast.success("Session ended successfully");
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error("Failed to end session");
    }
  };

  // Handle refresh balance
  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await fetchUserWallet();
    setIsRefreshing(false);
    toast.success("Balance refreshed successfully");
  };

  // SOCKET.IO SETUP - CRITICAL FIX
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("No authentication token found");
      return;
    }

    // Initialize socket
    socketRef.current = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5001', {
      auth: {
        token: token,
        userId: user._id,
        role: 'user'
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    // SOCKET EVENT HANDLERS
    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected as user:", user.name || user.username);
      socketRef.current.emit('join_user_room', { userId: user._id });
      
      // Join all existing chat rooms
      if (chatSessions.length > 0) {
        const roomNames = chatSessions.map(session => `chat_${session._id}`);
        roomNames.forEach(roomName => {
          socketRef.current.emit('join_room', roomName);
        });
        console.log('👥 Joined chat rooms:', roomNames);
      }
    });

    // NEW MESSAGE HANDLER - FIXED
    socketRef.current.on('new_message', (data) => {
      console.log('📩 New message received via socket:', data);
      const { message, chatSessionId, senderId, senderRole } = data;
      
      // Only handle messages from psychic
      if (senderRole !== 'psychic') {
        console.log("Ignoring message from non-psychic (probably own message)");
        return;
      }
      
      // Play notification sound
      if (senderId.toString() !== user._id.toString() && audioRef.current) {
        audioRef.current.play().catch(err => console.log('Audio play error:', err));
      }
      
      // If message is for current session, add to messages
      if (chatSessionId === selectedSessionRef.current?._id) {
        console.log("Adding message to current session messages");
        setMessages(prev => {
          const currentMsgs = prev[chatSessionId] || [];
          // Check if message already exists
          if (!currentMsgs.some(m => m._id === message._id)) {
            return {
              ...prev,
              [chatSessionId]: [...currentMsgs, message]
            };
          }
          return prev;
        });
        
        // Mark as read
        socketRef.current.emit('message_read', {
          messageId: message._id,
          chatSessionId
        });
      }
      
      // Update chat session list with new message
      setChatSessions(prev => prev.map(session => {
        if (session._id === chatSessionId) {
          // If this session is selected, don't increment unread count
          const isSelected = selectedSessionRef.current?._id === chatSessionId;
          return {
            ...session,
            lastMessage: message,
            lastMessageAt: new Date(),
            unreadCounts: {
              ...session.unreadCounts,
              user: isSelected ? 0 : (session.unreadCounts?.user || 0) + 1
            }
          };
        }
        return session;
      }));
      
      // Show notification if not viewing this chat
      if (chatSessionId !== selectedSessionRef.current?._id) {
        toast.info(`New message from psychic`);
      }
    });

    // Typing indicator
    socketRef.current.on('typing_indicator', ({ chatSessionId, isTyping }) => {
      if (chatSessionId === selectedSessionRef.current?._id) {
        setIsTyping(isTyping);
      }
    });

    // Chat request accepted
    socketRef.current.on('chat_request_accepted', (data) => {
      console.log('✅ Chat request accepted received:', data);
      if (pendingSession?._id === data.chatRequest._id) {
        setPendingSession(null);
        setPendingAcceptedRequest(data.chatRequest);
        setShowAcceptModal(true);
      }
      toast.success(`🎉 ${data.psychicName} accepted your chat request!`);
    });

    // Chat request rejected
    socketRef.current.on('chat_request_rejected', (data) => {
      console.log('❌ Chat request rejected received:', data);
      if (pendingSession?._id === data.requestId) {
        setPendingSession(null);
      }
      toast.error(`❌ ${data.psychicName} rejected your chat request`);
    });

    // Timer updates
    socketRef.current.on('timer_tick', (data) => {
      if (activeSession?._id === data.requestId) {
        setCountdownSeconds(data.remainingSeconds);
      }
    });

    // Balance updates
    socketRef.current.on('balance_updated', (data) => {
      if (activeSession?._id === data.requestId) {
        setUserCredits(data.newBalance);
        toast.info(`-${data.deductedAmount} credits deducted`);
      }
    });

    // Connect error
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearLocalTimer();
    };
  }, [user, chatSessions]);

  // Fetch chat sessions
  const fetchChats = useCallback(async () => {
    if (!user || !user._id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await chatApi.get('/api/humanchat/sessions');
      if (data.success) {
        setChatSessions(data.chatSessions || []);
        await fetchUserWallet();
        if (selectedSession) {
          await checkActiveChatRequest();
          await checkPendingRequest();
        }
      } else {
        throw new Error(data.message || "Failed to load chats");
      }
    } catch (err) {
      console.error("Fetch user chats error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load chats");
      toast.error(err.response?.data?.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [user, selectedSession, fetchUserWallet, checkActiveChatRequest, checkPendingRequest]);

  // Initial fetch
  useEffect(() => {
    if (user && user._id) {
      fetchChats();
    }
  }, [user, fetchChats]);

  // When selected session changes
  useEffect(() => {
    if (selectedSession) {
      checkActiveChatRequest();
      checkPendingRequest();
      // Join chat room for this session
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_room', `chat_${selectedSession._id}`);
      }
    }
  }, [selectedSession]);

  // Fetch messages for selected session
  const fetchMessages = useCallback(async (sessionId) => {
    if (!sessionId || !user) return;
    try {
      const { data } = await chatApi.get(`/api/humanchat/messages/${sessionId}`);
      if (data.success) {
        setMessages(prev => ({
          ...prev,
          [sessionId]: data.messages || []
        }));
        await chatApi.put(`/api/humanchat/messages/${sessionId}/read`);
        setChatSessions(prev =>
          prev.map(session =>
            session._id === sessionId
              ? { ...session, unreadCounts: { ...session.unreadCounts, user: 0 } }
              : session
          )
        );
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }, [user]);

  // Fetch messages when session is selected
  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession._id);
    }
  }, [selectedSession, fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      setTimeout(() => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
          const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          }
        }
      }, 100);
    }
  }, [messages[selectedSession?._id], isTyping]);

  // Filter sessions
  const filteredSessions = chatSessions.filter((session) => {
    const psychicName = session.psychic?.name?.toLowerCase() || '';
    const psychicBio = session.psychic?.bio?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return psychicName.includes(query) || psychicBio.includes(query);
  });

  // Select chat session
  const handleSelectSession = (session) => {
    setSelectedSession(session);
    if (isMobileView) {
      setShowChatList(false);
    }
  };

  // Back to chat list on mobile
  const handleBackToChatList = () => {
    if (isMobileView) {
      setShowChatList(true);
      setSelectedSession(null);
    }
  };

  // SEND MESSAGE - CRITICAL FIX
  const handleSend = async () => {
    const messageContent = input.trim();
    if (!messageContent || !selectedSession || !user || !socketRef.current?.connected) {
      return;
    }

    try {
      const { data } = await chatApi.post('/api/humanchat/messages', {
        chatSessionId: selectedSession._id,
        content: messageContent,
        messageType: "text",
      });

      if (data.success && data.message) {
        const newMessage = data.message;
        
        // Add message to state IMMEDIATELY
        setMessages(prev => ({
          ...prev,
          [selectedSession._id]: [...(prev[selectedSession._id] || []), newMessage],
        }));

        // Update session list
        setChatSessions(prev =>
          prev.map(session =>
            session._id === selectedSession._id
              ? {
                  ...session,
                  lastMessage: newMessage,
                  lastMessageAt: new Date(),
                }
              : session
          )
        );

        // Clear input
        setInput("");

        // Stop typing indicator
        socketRef.current.emit("typing", {
          chatSessionId: selectedSession._id,
          isTyping: false
        });

        // EMIT SOCKET EVENT FOR REAL-TIME DELIVERY
        socketRef.current.emit("send_message", {
          chatSessionId: selectedSession._id,
          message: newMessage,
          senderId: user._id,
          senderRole: 'user'
        });

        console.log("📤 Message sent via socket");

        // Focus input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err) {
      console.error("❌ Failed to send message", err);
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (selectedSession && socketRef.current?.connected) {
      socketRef.current.emit("typing", {
        chatSessionId: selectedSession._id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle accept session
  const handleAcceptSession = async (requestId) => {
    try {
      const response = await chatApi.post('/api/chatrequest/start-session', { requestId });
      if (response.data.success) {
        const sessionData = response.data.data;
        setPendingSession(null);
        setPendingAcceptedRequest(null);
        setShowAcceptModal(false);
        setActiveSession(sessionData);
        
        if (sessionData.paidSession?.remainingSeconds) {
          setCountdownSeconds(sessionData.paidSession.remainingSeconds);
          startLocalTimer(sessionData.paidSession.remainingSeconds);
        }
        
        await fetchUserWallet();
        toast.success("✅ Session started! Timer is running.");
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error(error.response?.data?.message || 'Failed to start session');
    }
  };

  // Handle decline accepted session
  const handleDeclineAccepted = async (requestId) => {
    try {
      const response = await chatApi.post('/api/chatrequest/decline-accepted', { requestId });
      if (response.data.success) {
        toast.success("Session declined successfully");
        setShowAcceptModal(false);
        setPendingAcceptedRequest(null);
        checkActiveChatRequest();
      }
    } catch (error) {
      console.error('Error declining session:', error);
      toast.error(error.response?.data?.message || 'Failed to decline session');
    }
  };

  // Handle end session
  const handleEndSession = async () => {
    if (!activeSession) return;
    if (!window.confirm("Are you sure you want to end this paid session?")) {
      return;
    }
    try {
      const response = await chatApi.post('/api/chatrequest/stop-timer', {
        requestId: activeSession._id
      });
      if (response.data.success) {
        setActiveSession(null);
        setCountdownSeconds(0);
        clearLocalTimer();
        await fetchUserWallet();
        toast.success("Session ended successfully");
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error("Failed to end session");
    }
  };

  // Cancel pending request
  const handleCancelRequest = async () => {
    if (!pendingSession) return;
    if (!window.confirm("Are you sure you want to cancel this request?")) {
      return;
    }
    try {
      const response = await chatApi.delete(`/api/chatrequest/requests/${pendingSession._id}`);
      if (response.data.success) {
        setPendingSession(null);
        toast.success("Request cancelled successfully");
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error("Failed to cancel request");
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  const currentMessages = messages[selectedSession?._id] || [];

  return (
    <div className="h-screen bg-[#f0f2f5] overflow-hidden">
      <div className="flex h-full">
        {/* Chat List Sidebar */}
        <div className={cn(
          "flex flex-col w-full md:w-96 bg-white border-r border-[#e9edef] transition-all duration-300 ease-in-out h-full",
          showChatList ? "flex" : "hidden md:flex"
        )}>
          <div className="p-4 bg-[#f0f2f5]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Search psychics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-gray-300 focus:border-[#00a884] rounded-lg text-sm"
              />
            </div>
          </div>
         
          <ScrollArea className="flex-1 bg-white">
            <div className="p-1">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-[#f5f6f6] flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No chats yet</p>
                  <Button
                    onClick={() => navigate('/psychics')}
                    className="mt-4 bg-[#00a884] hover:bg-[#128c7e]"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Browse Psychics
                  </Button>
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const hasActiveRequest = activeSession?.psychic?._id === session.psychic?._id;
                  const hasPendingRequest = pendingSession?.psychic?._id === session.psychic?._id;
                  
                  return (
                    <div
                      key={session._id}
                      onClick={() => handleSelectSession(session)}
                      className={cn(
                        "flex items-center p-3 hover:bg-[#f5f6f6] cursor-pointer border-b border-[#f0f2f5]",
                        selectedSession?._id === session._id && "bg-[#f0f2f5]",
                        hasActiveRequest && "border-l-4 border-l-[#00a884]",
                        hasPendingRequest && "border-l-4 border-l-[#ffcc00]"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={session.psychic?.image} />
                          <AvatarFallback className="bg-gradient-to-br from-[#00a884] to-[#128c7e] text-white">
                            {session.psychic?.name?.[0] || "P"}
                          </AvatarFallback>
                        </Avatar>
                        {hasActiveRequest && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-white font-bold">$</span>
                          </div>
                        )}
                      </div>
                   
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800 text-sm">
                              {session.psychic?.name || "Psychic"}
                            </h3>
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              <span className="text-xs text-gray-700">{session.psychic?.rating || 4.8}</span>
                            </div>
                            {hasActiveRequest && (
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatLastMessageTime(session.lastMessageAt)}
                          </span>
                        </div>
                    
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate max-w-[180px]">
                            {hasActiveRequest ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-green-600" />
                                Paid session: {formatCountdown(countdownSeconds)}
                              </span>
                            ) : session.lastMessage?.content || "No messages yet"}
                          </p>
                          {session.unreadCounts?.user > 0 && (
                            <span className="bg-[#00a884] text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                              {session.unreadCounts.user}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
       
        {/* Main Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-[#efeae2] bg-chat-pattern transition-all duration-300 ease-in-out h-full",
          !showChatList ? "flex" : "hidden md:flex"
        )}>
          {selectedSession ? (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="bg-white border-b border-[#e9edef]">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {isMobileView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBackToChatList}
                          className="md:hidden text-gray-600 hover:text-gray-900"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                      )}
                   
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedPsychic?.image} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {selectedPsychic?.name?.[0] || "P"}
                        </AvatarFallback>
                      </Avatar>
                   
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-gray-800">
                            {selectedPsychic?.name || "Psychic"}
                          </h2>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs text-gray-700">{selectedPsychic?.rating || 4.8}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {onlineStatus[selectedPsychic?._id] ? (
                            <span className="text-green-600">Online</span>
                          ) : (
                            `Last seen ${formatTime(selectedSession.lastMessageAt)}`
                          )}
                        </p>
                      </div>
                    </div>
                 
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-gray-500 hover:text-gray-700"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-gray-500 hover:text-gray-700"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CreditCard className="h-3 w-3" />
                        <span className="font-medium">{selectedPsychic?.ratePerMin || 0} credits/min</span>
                      </div>
                   
                      <div className="flex items-center gap-2">
                        {userCredits > 0 && (
                          <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            <Zap className="h-3 w-3" />
                            <span>{Number(userCredits).toFixed(2)} credits</span>
                          </div>
                        )}
                        <Button
                          onClick={handleRefreshBalance}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "⟳"
                          )}
                        </Button>
                      </div>
                    </div>
                  
                    <div className="flex items-center gap-2">
                      {activeSession && activeSession.status === 'active' ? (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-3 py-1.5">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-gray-600">Time left:</span>
                            </div>
                            <div className="text-lg font-bold text-green-700 font-mono">
                              {formatCountdown(countdownSeconds)}
                            </div>
                          </div>
                          <Button
                            onClick={handleEndSession}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                          >
                            End
                          </Button>
                        </div>
                      ) : pendingSession ? (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg px-3 py-1.5">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-700">Request Pending</span>
                          </div>
                          <Button
                            onClick={handleCancelRequest}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setShowRequestModal(true)}
                          disabled={userCredits < (selectedPsychic?.ratePerMin || 1)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          size="sm"
                        >
                          <Sparkles className="mr-2 h-3 w-3" />
                          Request Chat
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
             
              {/* Messages Area */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <div className="space-y-2 max-w-3xl mx-auto">
                    {currentMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-sm">
                          <Sparkles className="h-8 w-8 text-[#00a884]" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Start a conversation
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          Send your first message to {selectedPsychic?.name || "the psychic"}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center my-4">
                          <span className="bg-[#e1f5d5] text-gray-600 text-xs px-3 py-1 rounded-full">
                            Today
                          </span>
                        </div>
                        {currentMessages.map((msg, index) => {
                          const isUser = msg.senderModel === 'User';
                          const showTime = index === currentMessages.length - 1 ||
                                         currentMessages[index + 1]?.senderModel !== msg.senderModel;
                       
                          return (
                            <div
                              key={msg._id}
                              className={cn(
                                "flex",
                                isUser ? "justify-end" : "justify-start"
                              )}
                            >
                              <div className="max-w-[65%]">
                                {!isUser && (
                                  <span className="text-xs text-gray-500 mb-1 ml-1">
                                    {msg.sender?.name || 'Psychic'}
                                  </span>
                                )}
                                <div
                                  className={cn(
                                    "px-3 py-2 rounded-lg relative",
                                    isUser
                                      ? "bg-[#d9fdd3] rounded-br-none"
                                      : "bg-white rounded-bl-none shadow-sm"
                                  )}
                                >
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                               
                                  {showTime && (
                                    <div className={cn(
                                      "flex items-center gap-1 mt-1 text-xs",
                                      isUser ? "justify-end" : "justify-start"
                                    )}>
                                      <span className="text-gray-500">
                                        {formatMessageTime(msg.createdAt)}
                                      </span>
                                      {isUser && (
                                        <span className="ml-1">
                                          {getStatusIcon(msg.status)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                     
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-white px-3 py-2 rounded-lg rounded-bl-none shadow-sm max-w-[120px]">
                              <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                     
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </div>
              </ScrollArea>
             
              {/* Input Area */}
              <div className="bg-[#f0f2f5] p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-500 hover:text-gray-700"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-500 hover:text-gray-700"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
               
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder="Type a message"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="h-12 pl-4 pr-12 bg-white border-none rounded-full focus-visible:ring-0"
                    />
                  </div>
               
                  {input.trim() ? (
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="h-12 w-12 rounded-full bg-[#00a884] hover:bg-[#128c7e]"
                    >
                      <Send className="h-5 w-5 text-white" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 text-gray-500 hover:text-gray-700"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#efeae2] bg-chat-pattern">
              <div className="max-w-md text-center px-4">
                <div className="mx-auto h-24 w-24 rounded-full bg-white/80 flex items-center justify-center mb-6 shadow-lg">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#00a884]/20 to-[#128c7e]/10 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-[#00a884]" />
                  </div>
                </div>
                <h1 className="text-3xl font-light text-gray-700 mb-2">
                  Spiritual Connection
                </h1>
                <p className="text-gray-500 mb-8 text-base">
                  {chatSessions.length === 0
                    ? "Connect with psychics for guidance and insights"
                    : "Select a chat to start messaging"}
                </p>
                <div className="mb-6 p-4 bg-white/80 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Your Credits</span>
                    <span className="text-xl font-bold text-blue-600">
                      {Number(userCredits).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mt-2">
                    <Zap className="h-4 w-4" />
                    <span>For chat sessions</span>
                  </div>
                </div>
                {chatSessions.length === 0 && (
                  <Button
                    onClick={() => navigate('/psychics')}
                    className="bg-[#00a884] hover:bg-[#128c7e] text-white"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Browse Psychics
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
     
      {/* Modals */}
      {selectedPsychic && (
        <ChatRequestModal
          psychic={selectedPsychic}
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onRequestSent={handleRequestSent}
          userBalance={userBalance}
          userCredits={userCredits}
        />
      )}
     
      {selectedPsychic && showAcceptModal && pendingAcceptedRequest && (
        <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Paid Session?</DialogTitle>
              <DialogDescription>
                {selectedPsychic.name} has accepted your chat request. Would you like to start the paid session now?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Session Cost</span>
                </div>
                <div className="text-lg font-bold text-green-700">
                  {selectedPsychic?.ratePerMin || 0} credits/min
                </div>
              </div>
              <Button
                onClick={() => {
                  handleAcceptSession(pendingAcceptedRequest._id);
                  setShowAcceptModal(false);
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Accept and Start Session
              </Button>
              <Button
                onClick={() => {
                  handleDeclineAccepted(pendingAcceptedRequest._id);
                  setShowAcceptModal(false);
                }}
                variant="outline"
                className="w-full"
              >
                Decline Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}