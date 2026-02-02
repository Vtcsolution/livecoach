import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Search,
  MoreVertical,
  Sparkles,
  Shield,
  RefreshCw,
  Check,
  CheckCheck,
  Clock,
  Smile,
  AlertCircle,
  User,
  DollarSign,
  Play,
  Pause,
  StopCircle,
  Loader2,
  XCircle,
  CheckCircle,
  Calendar,
  Wallet,
  Timer,
  Users,
  Star,
  Zap,
  CreditCard,
  Bell,
  BellOff,
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePsychicAuth } from "../context/PsychicAuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import PsychicChatRequestModal from './ChatComponents/PsychicChatRequestModal';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
// ========== COMPONENTS ==========
// Update IncomingCallNotification for psychic
const IncomingCallNotification = ({ activeCall, callStatus, onAccept, onReject }) => {
  if (!activeCall || callStatus !== 'ringing') return null;
  // Extract user name properly
  const userName = activeCall.caller?.name ||
                   (activeCall.caller?.firstName ?
                     `${activeCall.caller.firstName} ${activeCall.caller.lastName || ''}`.trim() :
                     'User');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-pulse border-2 border-green-500">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <Avatar className="h-24 w-24 border-4 border-green-100">
              <AvatarImage src={activeCall.caller?.image} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                {userName[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2">
              <div className="relative">
                <div className="animate-ping absolute h-8 w-8 rounded-full bg-green-400 opacity-75"></div>
                <div className="relative h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                  <PhoneIncoming className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Incoming Call</h2>
          <p className="text-lg text-gray-600 mb-1">{userName}</p>
          <p className="text-sm text-gray-500 mb-6">
            {activeCall.callType === 'audio' ? 'Audio Call' : 'Video Call'}
          </p>
          <div className="flex items-center gap-6 mb-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <PhoneOff className="h-8 w-8 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-600">Decline</span>
            </div>
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mb-2">
                <Phone className="h-10 w-10 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600">Answer</span>
            </div>
          </div>
          <div className="flex gap-4 w-full">
            <Button
              onClick={onReject}
              variant="outline"
              className="flex-1 h-12 border-red-300 text-red-600 hover:bg-red-50"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              Decline
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
            >
              <Phone className="mr-2 h-5 w-5" />
              Answer
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            Accept call to start earning: {activeCall.ratePerMinute || activeCall.ratePerMin || psychic?.ratePerMin || 0} credits/min
          </p>
         
          {/* Debug info (optional) */}
          <div className="mt-4 text-xs text-gray-400">
            <p>Caller ID: {activeCall.caller?.id || 'Unknown'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
const ActiveCallUI = ({
  activeCall,
  callStatus,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  isMuted,
  isSpeaker,
  callDuration,
  creditsEarned,
  ratePerMin,
  nextEarningIn
}) => {
  if (!activeCall || callStatus !== 'in-progress') return null;
  // Extract user name
  const userName = activeCall.caller?.name ||
                   (activeCall.caller?.firstName ?
                     `${activeCall.caller.firstName} ${activeCall.caller.lastName || ''}`.trim() :
                     'User');
 
  const formattedDuration = formatCountdown(callDuration);
 
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center z-50">
      {/* User Info and Timer - Minimal */}
      <div className="text-center mb-20">
        <div className="mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
            {userName[0] || "U"}
          </div>
          <h2 className="text-xl font-bold text-white">{userName}</h2>
          <p className="text-sm text-gray-400">Audio Call</p>
        </div>
       
        {/* Large Timer */}
        <div className="text-5xl font-bold text-white font-mono mb-1">
          {formattedDuration}
        </div>
        <div className="text-sm text-green-400 flex items-center justify-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live • Earning credits</span>
        </div>
       
        {/* Credit Counter - Simple */}
        <div className="mt-6 bg-black/40 rounded-lg p-4 max-w-xs mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">Earned</div>
              <div className="text-xl font-bold text-yellow-400">
                +{creditsEarned?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Next in</div>
              <div className="text-xl font-bold text-blue-400">
                {nextEarningIn}s
              </div>
            </div>
          </div>
          <div className="text-xs text-center text-gray-500 mt-2">
            +{ratePerMin?.toFixed(2)} credits every minute
          </div>
        </div>
      </div>
     
      {/* Essential Controls Only */}
      <div className="flex items-center gap-6">
        {/* Mute Button */}
        <Button
          onClick={onToggleMute}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
          variant="ghost"
          size="icon"
        >
          {isMuted ? (
            <MicOff className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-white" />
          )}
        </Button>
        {/* End Call Button */}
        <Button
          onClick={onEndCall}
          className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
          size="icon"
        >
          <PhoneOff className="h-6 w-6 text-white" />
        </Button>
        {/* Speaker Button */}
        <Button
          onClick={onToggleSpeaker}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
          variant="ghost"
          size="icon"
        >
          {isSpeaker ? (
            <Volume2 className="h-5 w-5 text-white" />
          ) : (
            <VolumeX className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};
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
    case 'sending':
      return <Clock className="h-3 w-3 text-gray-400" />;
    case 'sent':
      return <Check className="h-3 w-3 text-gray-500" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-gray-500" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return <Clock className="h-3 w-3 text-gray-400" />;
  }
};
const formatCountdown = (seconds) => {
  if (!seconds || seconds <= 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};
// Function to check if input contains only emoji
const containsOnlyEmoji = (str) => {
  const trimmedStr = str.trim();
  if (trimmedStr.length === 0) return false;
 
  // Emoji regex pattern
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)+$/u;
  return emojiRegex.test(trimmedStr);
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
  const [typingUser, setTypingUser] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showChatList, setShowChatList] = useState(!isMobileView);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // ========== CHAT REQUEST & TIMER STATE ==========
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [isRefreshingTimer, setIsRefreshingTimer] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSyncInterval, setTimerSyncInterval] = useState(null);
 
  // ========== RINGTONE STATE ==========
  const [isRinging, setIsRinging] = useState(false);
  const [hasUnseenRequest, setHasUnseenRequest] = useState(false);
 
  // ========== MODAL STATE FIX ==========
  const [requestToShow, setRequestToShow] = useState(null);
  const [userForRequest, setUserForRequest] = useState(null);
 
  // ========== CALL SYSTEM STATE ==========
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, in-progress, ended
  const [twilioToken, setTwilioToken] = useState(null);
  const [callRoom, setCallRoom] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callQuality, setCallQuality] = useState('excellent');
  const [hasNewRequest, setHasNewRequest] = useState(false);
const [unseenRequestCount, setUnseenRequestCount] = useState(0);
  // ========== REFS ==========
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const messageAudioRef = useRef(null);
  const requestAudioRef = useRef(null);
  const callRingtoneRef = useRef(null); // Separate ref for call ringtone
  const typingTimeoutRef = useRef(null);
  const selectedSessionRef = useRef(null);
  const syncTimerRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const callDurationRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const isMountedRef = useRef(true);
  const chatRoomsJoined = useRef(new Set());
  const [psychicStatus, setPsychicStatus] = useState('offline');
const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // ========== AXIOS INSTANCE ==========
  const chatApi = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5000',
      timeout: 10000,
    });
   
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('psychicToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
   
    return instance;
  }, []);


  const currentMessages = messages[selectedSession?._id] || [];
  const selectedUser = selectedSession?.user || null;
  const hasPendingRequest = pendingRequests.some(req => req.user?._id === selectedUser?._id);
 
  const activeSessionForUser = useMemo(() => {
    if (!activeSession || !selectedUser) return null;
   
    const activeSessionUserId =
      activeSession.user?._id ||
      activeSession.userId ||
      (typeof activeSession.user === 'string' ? activeSession.user : null);
   
    const selectedUserId = selectedUser._id;
   
    const isMatch = activeSessionUserId === selectedUserId;
   
    return isMatch && activeSession.status === 'active' ? activeSession : null;
  }, [activeSession, selectedUser]);

// Auto update status based on active session
useEffect(() => {
  if (activeSessionForUser) {
    // When session starts, set status to busy
    if (psychicStatus !== 'busy') {
      updateStatusToBusy();
    }
  } else {
    // When session ends, revert to online if busy
    if (psychicStatus === 'busy') {
      updateStatusToOnline();
    }
  }
}, [activeSessionForUser]);


  // ========== AUDIO INITIALIZATION ==========
  useEffect(() => {
    // Message notification sound
    messageAudioRef.current = new Audio('/message_ring.mp3');
    messageAudioRef.current.volume = 0.5;
   
    // Chat request ringtone (looping)
    requestAudioRef.current = new Audio('/new_chat_request.mp3');
    requestAudioRef.current.volume = 0.7;
    requestAudioRef.current.loop = true;
   
    // Call ringtone
    callRingtoneRef.current = new Audio('/call_ringtone.mp3');
    callRingtoneRef.current.loop = true;
   
    return () => {
      // Clean up audio
      if (messageAudioRef.current) {
        messageAudioRef.current.pause();
        messageAudioRef.current = null;
      }
      if (requestAudioRef.current) {
        requestAudioRef.current.pause();
        requestAudioRef.current = null;
      }
      if (callRingtoneRef.current) {
        callRingtoneRef.current.pause();
        callRingtoneRef.current = null;
      }
      // Clean up ringing interval
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
      }
      // Clean up call duration timer
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
    };
  }, []);
const [realTimeCallData, setRealTimeCallData] = useState({
  creditsEarned: 0,
  nextEarningIn: 60,
  ratePerMin: psychic?.ratePerMin || 0,
  earningHistory: []
});
const [callSyncInterval, setCallSyncInterval] = useState(null);
// Sync call timer for psychic
const syncPsychicCallTimer = useCallback(async () => {
  if (!activeCall || callStatus !== 'in-progress') return;
 
  try {
    const response = await chatApi.get(`/api/calls/sync-timer-psychic/${activeCall.callId}`);
   
    if (response.data.success) {
      const callData = response.data.call;
     
      // Update call duration
      if (callData.elapsedSeconds > 0) {
        setCallDuration(callData.elapsedSeconds);
      }
     
      // Calculate credits earned (1 credit per minute of call)
      const minutesElapsed = Math.floor(callData.elapsedSeconds / 60);
      const creditsEarned = minutesElapsed; // 1 credit per minute
     
      // Calculate next earning time (when next minute completes)
      const secondsInCurrentMinute = callData.elapsedSeconds % 60;
      const nextEarningIn = 60 - secondsInCurrentMinute;
     
      setRealTimeCallData(prev => ({
        ...prev,
        creditsEarned,
        nextEarningIn,
        ratePerMin: 1 // 1 credit per minute
      }));
    }
  } catch (error) {
    console.error('Failed to sync psychic call timer:', error);
  }
}, [activeCall, callStatus]);
// Start real-time sync for psychic
useEffect(() => {
  if (activeCall && callStatus === 'in-progress') {
    // Initial sync
    syncPsychicCallTimer();
   
    // Set up sync interval (every 1 second)
    const interval = setInterval(() => {
      syncPsychicCallTimer();
     
      // Update next earning counter
      setRealTimeCallData(prev => ({
        ...prev,
        nextEarningIn: prev.nextEarningIn > 0 ? prev.nextEarningIn - 1 : 60
      }));
     
    }, 1000);
   
    setCallSyncInterval(interval);
   
    return () => {
      if (interval) clearInterval(interval);
    };
  } else {
    if (callSyncInterval) {
      clearInterval(callSyncInterval);
      setCallSyncInterval(null);
    }
  }
}, [activeCall, callStatus, syncPsychicCallTimer]);
// Handle credit deduction events (psychic sees when user pays)
// Handle credit deduction events (psychic sees when user pays)
useEffect(() => {
  if (!socketRef.current) return;
  const handleRealtimeCreditDeduction = (data) => {
    console.log('💰 USER CREDIT DEDUCTION (Psychic sees):', data);
   
    // Psychic earns 1 credit per minute
    const earnedAmount = 1; // Fixed 1 credit per minute
   
    setRealTimeCallData(prev => ({
      ...prev,
      creditsEarned: prev.creditsEarned + earnedAmount,
      earningHistory: [
        ...prev.earningHistory.slice(-4),
        {
          amount: earnedAmount,
          time: new Date(),
          minute: data.minuteNumber
        }
      ]
    }));
   
    // Show earning notification
    toast.success(
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-green-500 animate-bounce" />
        <span className="font-bold text-green-600">
          +{earnedAmount} credit earned!
        </span>
        <span className="text-gray-600">(Minute {data.minuteNumber})</span>
      </div>,
      {
        duration: 3000,
        icon: <div className="h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
      }
    );
  };
  socketRef.current.on('realtime_credit_deduction', handleRealtimeCreditDeduction);
  return () => {
    if (socketRef.current) {
      socketRef.current.off('realtime_credit_deduction', handleRealtimeCreditDeduction);
    }
  };
}, []);





// Fetch psychic status on component mount
useEffect(() => {
  const fetchPsychicStatus = async () => {
    try {
      const token = localStorage.getItem('psychicToken');
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/my-status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPsychicStatus(response.data.status || 'offline');
      }
    } catch (error) {
      console.error('Failed to fetch psychic status:', error);
    }
  };

  if (psychic && isAuthenticated) {
    fetchPsychicStatus();
  }
}, [psychic, isAuthenticated]);

// Generic function to update status
const updateStatus = async (newStatus) => {
  console.log(`🚀 Updating status to: ${newStatus}`);
  console.log('Current status:', psychicStatus);
  console.log('Is updating?', isUpdatingStatus);
  
  if (isUpdatingStatus || psychicStatus === newStatus) {
    console.log(`⏸️ Already updating or already ${newStatus}, skipping...`);
    return;
  }
  
  setIsUpdatingStatus(true);
  try {
    const token = localStorage.getItem('psychicToken');
    console.log('📤 Making API call with token:', token ? 'Token exists' : 'No token');
    console.log('API URL:', `${import.meta.env.VITE_BASE_URL}/api/human-psychics/status`);
    
    const response = await axios.put(
      `${import.meta.env.VITE_BASE_URL}/api/human-psychics/status`,
      {
        status: newStatus
      },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ API Response:', response.data);
    
    if (response.data.success) {
      console.log(`🎉 Status updated to ${newStatus} successfully`);
      setPsychicStatus(newStatus);
      toast.success(`Status set to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
      
      // Update local storage for debugging
      localStorage.setItem('lastStatusUpdate', JSON.stringify({
        time: new Date().toISOString(),
        status: newStatus,
        response: response.data
      }));
    } else {
      console.error('❌ API returned success:false', response.data);
      toast.error('Failed to update status: ' + (response.data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Failed to update status:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config?.url
    });
    
    toast.error('Failed to update status: ' + (error.response?.data?.message || error.message));
  } finally {
    console.log('🔄 Setting isUpdatingStatus to false');
    setIsUpdatingStatus(false);
  }
};

const updateStatusToBusy = () => updateStatus('busy');
const updateStatusToOnline = () => updateStatus('online');

// Convenience functions for specific statuses
const handleSetOnline = () => updateStatus('online');
const handleSetBusy = () => updateStatus('busy');

// Listen for status changes via socket
useEffect(() => {
  if (!socketRef.current) return;

  const handleStatusChange = (data) => {
    if (data.psychicId === psychic?._id) {
      console.log('📡 Socket status update received:', data.status);
      setPsychicStatus(data.status);
    }
  };

  socketRef.current.on('psychic_status_changed', handleStatusChange);

  return () => {
    if (socketRef.current) {
      socketRef.current.off('psychic_status_changed', handleStatusChange);
    }
  };
}, [socketRef.current, psychic]);

// Add auto-online when page loads (optional)
useEffect(() => {
  const setOnlineOnLoad = async () => {
    // Only set to online if current status is offline
    if (psychicStatus === 'offline' && psychic && isAuthenticated && !isUpdatingStatus) {
      console.log('🔄 Page loaded, setting psychic to online');
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        updateStatus('online');
      }, 1000);
    }
  };

  setOnlineOnLoad();
}, [psychic, isAuthenticated]);

// Listen for status changes via socket (optional - remove if not needed)
useEffect(() => {
  if (!socketRef.current) return;

  const handleStatusChange = (data) => {
    if (data.psychicId === psychic?._id) {
      setPsychicStatus(data.status);
    }
  };

  socketRef.current.on('psychic_status_changed', handleStatusChange);

  return () => {
    if (socketRef.current) {
      socketRef.current.off('psychic_status_changed', handleStatusChange);
    }
  };
}, [socketRef.current, psychic]);  // ========== CALL SYSTEM FUNCTIONS ==========
  // Get Twilio token for psychic - UPDATED
const getTwilioToken = async () => {
  try {
    const response = await chatApi.get('/api/calls/token');
    if (response.data.success) {
      setTwilioToken(response.data.token);
      console.log('✅ Twilio token received for psychic');
      return response.data.token;
    }
  } catch (error) {
    console.error('Failed to get Twilio token for psychic:', error);
  }
  return null;
};
  // Start call duration timer
  const startCallDuration = () => {
    clearCallDuration();
    setCallDuration(0);
   
    callDurationRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };
  const clearCallDuration = () => {
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current);
      callDurationRef.current = null;
    }
  };
const acceptCall = async () => {
  if (!activeCall) return;
  console.log('📞 Psychic accepting call:', activeCall.callId);
  try {
    // Update UI state immediately for better UX
    setCallStatus('in-progress');
   
    const response = await chatApi.post('/api/calls/accept-psychic', {
      callId: activeCall.callId
    });
    console.log('✅ Accept call response:', response.data);
    if (response.data.success) {
      // Update active call with backend data
      setActiveCall(prev => ({
        ...prev,
        ...response.data.call,
        answeredAt: response.data.call.answeredAt // Timer start time
      }));
      // Start call duration timer (starts when psychic accepts)
      startCallDuration();
      // Emit socket event - only plain data
      if (socketRef.current?.connected) {
        const cleanAcceptData = {
          callId: activeCall.callId,
          chatSessionId: activeCall.chatSessionId,
          psychicId: psychic._id,
          psychicName: psychic.name,
          timestamp: new Date().toISOString()
        };
       
        socketRef.current.emit('accept_call', cleanAcceptData);
       
        // Also emit to call room
        socketRef.current.emit('call_accepted', {
          callId: activeCall.callId,
          acceptedBy: psychic._id,
          acceptorModel: 'Psychic',
          acceptorName: psychic.name
        });
      }
      // Stop call ringtone
      stopCallRingtone();
     
      toast.success('Call connected! Timer started.');
    }
  } catch (error) {
    console.error('❌ Failed to accept call:', error);
    // Revert state if failed
    setCallStatus('ringing');
   
    // Clean error message
    const errorMessage = error.response?.data?.message ||
                        error.message ||
                        'Failed to accept call';
    toast.error(`Failed to accept call: ${errorMessage}`);
  }
};
const rejectCall = async () => {
  if (!activeCall) return;
  console.log('❌ Psychic rejecting call:', activeCall.callId);
  try {
    // Use the psychic-specific endpoint with rejection reason
    const response = await chatApi.post('/api/calls/end-psychic', {
      callId: activeCall.callId,
      reason: 'rejected_by_psychic'
    });
    if (response.data.success) {
      // Emit socket event
      if (socketRef.current?.connected) {
        socketRef.current.emit('call_rejected', {
          callId: activeCall.callId,
          rejectedBy: psychic._id,
          reason: 'rejected_by_psychic',
          timestamp: new Date().toISOString()
        });
      }
      // Update state
      setCallStatus('ended');
      setActiveCall(null);
      clearCallDuration();
      stopCallRingtone();
     
      toast.success('Call rejected');
    }
  } catch (error) {
    console.error('Failed to reject call:', error);
   
    // Fallback: Just update local state
    setCallStatus('ended');
    setActiveCall(null);
    clearCallDuration();
    stopCallRingtone();
   
    toast.success('Call rejected locally');
  }
};
const endCall = async (reason = 'ended_by_psychic') => {
  console.log('🔴 END CALL TRIGGERED', {
    callId: activeCall?.callId,
    callStatus: callStatus
  });
  if (!activeCall?.callId) {
    console.error('❌ No activeCall or callId found');
    toast.error('No active call found');
    return;
  }
  try {
    // Clean up timers and audio first
    clearCallDuration();
    stopCallRingtone();
    cleanupWebRTC();
   
   
    // Create CLEAN, minimal data object - NO REACT/DOM OBJECTS
    const cleanCallData = {
      callId: activeCall.callId,
      reason: reason,
      duration: callDuration || 0,
      // Extract only primitive values from caller
      callerId: extractPrimitiveValue(activeCall.caller, 'id') ||
                extractPrimitiveValue(activeCall.caller, '_id') ||
                'unknown',
      // Clean up any nested objects
      ...(activeCall.callType && { callType: activeCall.callType }),
      ...(activeCall.chatSessionId && { chatSessionId: activeCall.chatSessionId })
    };
   
    console.log('📤 Sending clean call data:', cleanCallData);
   
    let response;
    try {
      response = await chatApi.post('/api/calls/end-psychic', cleanCallData);
    } catch (error1) {
      console.error('Psychic endpoint failed, trying fallback:', error1);
      response = await chatApi.post('/api/calls/end', cleanCallData);
    }
    if (response?.data?.success) {
      // Create even cleaner socket data
      const socketData = {
        callId: cleanCallData.callId,
        endedBy: psychic?._id,
        endedByName: psychic?.name || 'Psychic',
        duration: cleanCallData.duration,
        reason: cleanCallData.reason,
        timestamp: new Date().toISOString()
      };
     
      // Emit socket events
      if (socketRef.current?.connected) {
        socketRef.current.emit('call_ended', socketData);
        socketRef.current.emit('end_call', {
          callId: cleanCallData.callId,
          reason: cleanCallData.reason
        });
      }
      // Update state
      setCallStatus('ended');
      setActiveCall(null);
      setCallRoom(null);
     
      // Reset real-time data
      setRealTimeCallData({
        creditsEarned: 0,
        nextEarningIn: 60,
        ratePerMin: psychic?.ratePerMin || 0,
        earningHistory: []
      });
      // Clear intervals
      if (callSyncInterval) {
        clearInterval(callSyncInterval);
        setCallSyncInterval(null);
      }
      // Show success
      toast.dismiss();
      const earnings = response.data.earnings?.psychicEarned ||
                      response.data.call?.creditsUsed ||
                      0;
     
      if (earnings > 0) {
        toast.success(`Call ended. You earned: +${earnings.toFixed(2)} credits`, {
          duration: 5000
        });
      } else {
        toast.success(`Call ended. Duration: ${formatCountdown(callDuration)}`);
      }
     
    } else {
      throw new Error(response?.data?.message || 'Failed to end call');
    }
   
  } catch (error) {
    console.error('❌ END CALL ERROR:', error);
    toast.dismiss();
   
    // Show error but still update UI
    let errorMessage = 'Failed to end call';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message && !error.message.includes('circular')) {
      errorMessage = error.message;
    }
   
    toast.error(errorMessage);
   
    // Update UI even if backend fails
    setCallStatus('ended');
    setActiveCall(null);
    clearCallDuration();
    stopCallRingtone();
    cleanupWebRTC();
  }
};
// Helper function to extract primitive values
const extractPrimitiveValue = (obj, key) => {
  if (!obj) return null;
 
  // If obj is a string/number, return it
  if (typeof obj !== 'object') return obj;
 
  // If it's an object with the key
  if (obj[key] !== undefined) {
    const value = obj[key];
    // Return only if it's a primitive
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
  }
 
  return null;
};
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement actual audio mute logic here
  };
  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
    // Implement actual speaker toggle logic here
  };
  // Make sure this cleanup function is comprehensive
const cleanupWebRTC = () => {
  console.log('🧹 Cleaning up WebRTC...');
 
  if (peerConnectionRef.current) {
    peerConnectionRef.current.close();
    peerConnectionRef.current = null;
  }
 
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    localStreamRef.current = null;
  }
 
  if (remoteStreamRef.current) {
    remoteStreamRef.current.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    remoteStreamRef.current = null;
  }
 
  // Clear any media elements
  const audioElements = document.querySelectorAll('audio');
  const videoElements = document.querySelectorAll('video');
 
  audioElements.forEach(el => {
    el.pause();
    el.srcObject = null;
  });
 
  videoElements.forEach(el => {
    el.pause();
    el.srcObject = null;
  });
};
// Make sure safeEmit is defined before using it
const safeEmit = useCallback((event, data) => {
  if (!socketRef.current?.connected) {
    console.log(`⚠️ Socket not connected, cannot emit ${event}`);
    return false;
  }
 
  try {
    // Function to clean data of any non-serializable content
    const cleanData = (obj) => {
      if (obj === null || obj === undefined) return obj;
     
      // Handle primitive types
      if (typeof obj !== 'object') return obj;
     
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => cleanData(item));
      }
     
      // Handle Date objects
      if (obj instanceof Date) {
        return obj.toISOString();
      }
     
      // Handle objects - recursively clean each property
      const result = {};
      for (const key in obj) {
        const value = obj[key];
       
        // Skip React-specific properties and DOM elements
        if (
          key.startsWith('_') ||
          key.startsWith('__react') ||
          key === '$$typeof' ||
          value instanceof HTMLElement ||
          value instanceof Function ||
          (value && value.$$typeof) // React elements
        ) {
          continue;
        }
       
        // Recursively clean nested objects
        result[key] = cleanData(value);
      }
      return result;
    };
   
    const cleanedData = cleanData(data);
    console.log(`📤 Emitting ${event}:`, cleanedData);
   
    socketRef.current.emit(event, cleanedData);
    return true;
  } catch (error) {
    console.error(`❌ Failed to emit ${event}:`, error);
   
    // Try a simpler approach if the first one fails
    try {
      const simpleData = {
        callId: data.callId,
        timestamp: new Date().toISOString()
      };
      socketRef.current.emit(event, simpleData);
      console.log(`📤 Emitted ${event} with minimal data`);
      return true;
    } catch (simpleError) {
      console.error(`❌ Even minimal emit failed for ${event}:`, simpleError);
      return false;
    }
  }
}, [socketRef.current]);
  // Start WebRTC call
  const startWebRTCCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall?.callType === 'video'
      });
     
      localStreamRef.current = stream;
      // Create RTCPeerConnection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      // Add local stream to connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        // You can attach this to an audio/video element
      };
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current?.connected) {
          socketRef.current.emit('ice_candidate', {
            callId: activeCall.callId,
            candidate: event.candidate,
            from: psychic._id
          });
        }
      };
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      if (socketRef.current?.connected) {
        socketRef.current.emit('webrtc_offer', {
          callId: activeCall.callId,
          offer,
          from: psychic._id
        });
      }
    } catch (error) {
      console.error('WebRTC error:', error);
      toast.error('Failed to start media stream');
      endCall('media_error');
    }
  };
  // Handle WebRTC offer
  const handleWebRTCOffer = async (data) => {
    const { callId, offer, from } = data;
   
    if (callId !== activeCall?.callId) return;
    try {
      const peerConnection = peerConnectionRef.current;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      // Create and send answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      if (socketRef.current?.connected) {
        socketRef.current.emit('webrtc_answer', {
          callId,
          answer,
          from: psychic._id
        });
      }
    } catch (error) {
      console.error('WebRTC offer error:', error);
    }
  };
  // Handle WebRTC answer
  const handleWebRTCAnswer = async (data) => {
    const { callId, answer, from } = data;
   
    if (callId !== activeCall?.callId) return;
    try {
      const peerConnection = peerConnectionRef.current;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('WebRTC answer error:', error);
    }
  };
  // Handle ICE candidate
  const handleICECandidate = async (data) => {
    const { callId, candidate, from } = data;
   
    if (callId !== activeCall?.callId) return;
    try {
      const peerConnection = peerConnectionRef.current;
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('ICE candidate error:', error);
    }
  };
  // Play call ringtone
  const playCallRingtone = () => {
    if (callRingtoneRef.current && callStatus === 'ringing') {
      callRingtoneRef.current.play().catch(err => {
        console.log('Call ringtone play error:', err);
      });
    }
  };
  const stopCallRingtone = () => {
    if (callRingtoneRef.current) {
      callRingtoneRef.current.pause();
      callRingtoneRef.current.currentTime = 0;
    }
  };
  // Control call ringtone based on call status
  useEffect(() => {
    if (callStatus === 'ringing') {
      playCallRingtone();
    } else {
      stopCallRingtone();
    }
  }, [callStatus]);
  // ========== RINGTONE CONTROL FUNCTIONS ==========
const startRinging = useCallback(() => {
  if (!requestAudioRef.current || isRinging) return;
 
  try {
    // Play the ringtone
    const playPromise = requestAudioRef.current.play();
   
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsRinging(true);
          console.log('🔔 Ringtone started');
         
          // Ensure looping
          requestAudioRef.current.loop = true;
         
          // Set up interval to restart if it stops (backup)
          ringIntervalRef.current = setInterval(() => {
            if (requestAudioRef.current && isRinging && requestAudioRef.current.paused) {
              console.log('🔔 Restarting ringtone');
              requestAudioRef.current.currentTime = 0;
              requestAudioRef.current.play().catch(e => console.error('Ringtone restart failed:', e));
            }
          }, 3000);
        })
        .catch(error => {
          console.error('Failed to start ringtone:', error);
          // Autoplay might be blocked, show visual indicator only
          setIsRinging(true);
          setHasUnseenRequest(true);
        });
    }
  } catch (error) {
    console.error('Error starting ringtone:', error);
    setIsRinging(true); // At least show visual indicator
    setHasUnseenRequest(true);
  }
}, [isRinging]);
const stopRinging = useCallback(() => {
  console.log('🔇 Stopping ringtone');
 
  setIsRinging(false);
  setHasUnseenRequest(false);
 
  // Clear ring interval
  if (ringIntervalRef.current) {
    clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = null;
  }
 
  // Stop audio
  if (requestAudioRef.current) {
    requestAudioRef.current.pause();
    requestAudioRef.current.currentTime = 0;
  }
}, []);
// Control ringing based on pending requests AND modal state
useEffect(() => {
  if (pendingRequests.length > 0 && !showRequestModal) {
    if (!isRinging) {
      console.log('🔔 Starting ringtone: pending requests exist and modal not open');
      startRinging();
    }
  } else {
    if (isRinging) {
      console.log('🔇 Stopping ringtone: no requests or modal is open');
      stopRinging();
    }
  }
}, [pendingRequests, showRequestModal, isRinging, startRinging, stopRinging]);
// Ensure ringtone stops when modal opens
useEffect(() => {
  if (showRequestModal && isRinging) {
    console.log('🔇 Modal opened, stopping ringtone');
    stopRinging();
  }
}, [showRequestModal, isRinging, stopRinging]);
  // ========== BACKEND TIMER SYNC FUNCTIONS ==========
  const syncTimerWithBackend = useCallback(async (force = false) => {
    if (!activeSession?._id || !isMountedRef.current) return;
   
    try {
      console.log('🔄 Psychic syncing timer with backend for session:', activeSession._id);
     
      // Use psychic-specific timer endpoint
      const response = await chatApi.get(`/api/chatrequest/timer/${activeSession._id}`);
     
      if (response.data.success && response.data.data) {
        const timerData = response.data.data;
        console.log('⏰ Backend timer data for psychic:', timerData);
       
        // Update countdown from backend
        setCountdownSeconds(timerData.remainingSeconds);
        setTimerPaused(timerData.isPaused || false);
       
        // Update active session
        setActiveSession(prev => ({
          ...prev,
          status: timerData.status,
          paidSession: {
            ...prev?.paidSession,
            remainingSeconds: timerData.remainingSeconds,
            isPaused: timerData.isPaused || false,
            lastSyncTime: new Date()
          }
        }));
       
        // Handle session ended
        if (timerData.remainingSeconds <= 0 || timerData.status === 'completed') {
          console.log('⏰ Session ended on backend, cleaning up');
          setActiveSession(null);
          setCountdownSeconds(0);
          setTimerPaused(false);
         
          if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
          }
         
          toast.info("Session has ended", { duration: 3000 });
        }
       
        return timerData;
      }
    } catch (error) {
      console.error('Failed to sync timer with backend:', error);
    }
  }, [activeSession, chatApi]);
  // Start periodic timer sync with backend
  useEffect(() => {
    if (activeSession?.status === 'active') {
      // Initial sync
      syncTimerWithBackend(true);
     
      // Set up sync interval (every 5 seconds)
      syncTimerRef.current = setInterval(() => {
        syncTimerWithBackend();
      }, 5000);
     
      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
        }
      };
    } else {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    }
  }, [activeSession, syncTimerWithBackend]);
  // ========== COMPONENT LIFECYCLE ==========
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
      }
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
      chatRoomsJoined.current.clear();
      clearTimeout(typingTimeoutRef.current);
      cleanupWebRTC();
    };
  }, []);
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);
  // ========== MOBILE VIEW HANDLING ==========
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
  // ========== AUTH CHECK ==========
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/psychic/login");
    }
  }, [authLoading, isAuthenticated, navigate]);
  // ========== ACTIVE SESSION CHECK ==========
  const checkActiveSession = useCallback(async (force = false) => {
    if (!psychic || !isAuthenticated || !isMountedRef.current) return;
   
    try {
      console.log('🔄 Checking active session for psychic...');
     
      if (force || !activeSession) {
        setIsRefreshingTimer(true);
      }
     
      // Use the correct endpoint for psychic active session
      const response = await chatApi.get('/api/chatrequest/active-session-psychic');
     
      if (response.data.success && isMountedRef.current) {
        const sessionData = response.data.data;
       
        if (sessionData && sessionData.status === 'active') {
          console.log('✅ Found active session:', sessionData);
         
          // Ensure proper user structure
          const enhancedSessionData = {
            ...sessionData,
            user: sessionData.user || { _id: sessionData.userId }
          };
         
          setActiveSession(enhancedSessionData);
          setTimerPaused(sessionData.paidSession?.isPaused || false);
         
          // IMPORTANT: Get timer data from backend immediately
          const timerResponse = await chatApi.get(`/api/chatrequest/timer/${sessionData._id}`);
          if (timerResponse.data.success) {
            const timerData = timerResponse.data.data;
            console.log('⏰ Initial timer sync from backend:', timerData.remainingSeconds);
            setCountdownSeconds(timerData.remainingSeconds);
          }
         
          // Clear any pending requests for this user
          if (enhancedSessionData.user?._id) {
            setPendingRequests(prev =>
              prev.filter(req => req.user?._id !== enhancedSessionData.user._id)
            );
          }
        } else {
          console.log('❌ No active session found');
          setActiveSession(null);
          setCountdownSeconds(0);
          setTimerPaused(false);
         
          // Clear sync interval
          if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
          }
        }
      } else if (isMountedRef.current) {
        setActiveSession(null);
        setCountdownSeconds(0);
        setTimerPaused(false);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
      if (force && isMountedRef.current) {
        setActiveSession(null);
        setCountdownSeconds(0);
        setTimerPaused(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshingTimer(false);
      }
    }
  }, [psychic, isAuthenticated, activeSession, chatApi]);
// Add this function near your other fetch functions
// Update checkNewChatRequests function
const checkNewChatRequests = useCallback(async () => {
  if (!psychic || !isAuthenticated) return;

  try {
    const response = await chatApi.get('/api/chatrequest/psychic/pending-requests');
   
    if (response.data.success && isMountedRef.current) {
      const requests = response.data.data || [];
      
      // Format requests with username
      const formattedRequests = requests.map(request => {
        const user = request.user || {};
        const username = user.username || 'user';
        const displayName = username 
          ? `@${username}`
          : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        
        return {
          ...request,
          user: {
            ...user,
            displayName,
            username
          }
        };
      });
      
      console.log('🔔 New requests with usernames:', formattedRequests);
     
      // Update pending requests
      setPendingRequests(formattedRequests);
     
      // Update notification state
      setHasNewRequest(formattedRequests.length > 0);
      setUnseenRequestCount(formattedRequests.length);
     
      // Play ringtone only if there are new requests AND modal is not open
      if (formattedRequests.length > 0 && !isRinging && !showRequestModal) {
        console.log('🔔 Starting ringtone for', formattedRequests.length, 'new requests');
        startRinging();
      } else if (formattedRequests.length === 0 && isRinging) {
        stopRinging();
      }
    }
  } catch (error) {
    console.error('Error checking new requests:', error);
  }
}, [psychic, isAuthenticated, isRinging, showRequestModal, startRinging, stopRinging, chatApi]);
  // Update the fetchPendingRequests function
const fetchPendingRequests = async () => {
  if (!psychic || !isAuthenticated) return;

  try {
    const response = await chatApi.get('/api/chatrequest/psychic/pending-requests');

    if (response.data.success && isMountedRef.current) {
      const allRequests = response.data.data || [];
      
      // Format requests with username display
      const formattedRequests = allRequests.map(request => {
        const user = request.user || {};
        
        // Get username for display
        const username = user.username || 'user';
        const displayName = username 
          ? `@${username}`
          : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        
        return {
          ...request,
          user: {
            ...user,
            displayName,
            username
          }
        };
      });
      
      // Filter requests for current user if we have selected session
      if (selectedSession?.user?._id) {
        const userRequests = formattedRequests.filter(req => 
          req.user?._id === selectedSession.user._id
        );
        setPendingRequests(userRequests);
      } else {
        setPendingRequests(formattedRequests);
      }
      
      console.log('📋 Pending requests with usernames:', formattedRequests);
    }
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    setPendingRequests([]);
  }
};

  // Get online status
  const getOnlineStatus = useCallback(async () => {
    if (!psychic || !isAuthenticated) return;
  
    try {
      const userIds = chatSessions
        .map(s => s.user?._id)
        .filter(id => id);
    
      if (userIds.length > 0 && socketRef.current?.connected) {
        socketRef.current.emit('get_online_status', { userIds });
      }
    } catch (error) {
      console.error("Error getting online status:", error);
    }
  }, [psychic, isAuthenticated, chatSessions]);
  // Fetch chat sessions
  // Update fetchChats function
const fetchChats = useCallback(async () => {
  if (!psychic || !isAuthenticated) return;
  setRefreshing(true);
  setError(null);
  try {
    const { data } = await chatApi.get('/api/psychic/sessions');
  
    if (data.success && isMountedRef.current) {
      // Format sessions with username display
      const formattedSessions = (data.chatSessions || []).map(session => {
        const user = session.user || {};
        const username = user.username || 'user';
        const displayName = username 
          ? `@${username}`
          : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        
        return {
          ...session,
          user: {
            ...user,
            displayName,
            username
          }
        };
      });
      
      console.log("📋 Fetched chat sessions with usernames:", formattedSessions.length);
      setChatSessions(formattedSessions);
    
      // Join chat rooms only if socket is connected
      if (socketRef.current?.connected && formattedSessions?.length > 0) {
        const sessionIds = formattedSessions.map(s => s._id) || [];
      
        // Filter out already joined rooms
        const roomsToJoin = sessionIds.filter(id => !chatRoomsJoined.current.has(id));
      
        if (roomsToJoin.length > 0) {
          console.log(`Joining ${roomsToJoin.length} new chat rooms`);
          roomsToJoin.forEach(chatId => {
            const roomName = `chat_${chatId}`;
            socketRef.current.emit("join_room", roomName);
            chatRoomsJoined.current.add(chatId);
          });
        }
      }
    } else {
      throw new Error(data.message || "Failed to load chats");
    }
  } catch (err) {
    console.error("Fetch chats error:", err);
    const errorMsg = err.response?.data?.message || err.message || "Failed to load chats";
    setError(errorMsg);
  
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
}, [psychic, isAuthenticated, navigate, logout, chatApi]);
  // Initial fetch and check active session
  // Update your initial fetch useEffect
useEffect(() => {
  if (psychic && isAuthenticated && isMountedRef.current) {
    fetchChats();
    fetchPendingRequests();
    checkNewChatRequests(); // Add this line
    checkActiveSession();
    getTwilioToken();
  }
}, [psychic, isAuthenticated]);
  // Check active session when selected session changes
  useEffect(() => {
    if (selectedSession && psychic && isAuthenticated) {
      checkActiveSession();
      fetchPendingRequests();
    }
  }, [selectedSession, psychic, isAuthenticated]);
  // ========== SOCKET.IO REAL-TIME MESSAGING & CALLS ==========
  useEffect(() => {
    if (!psychic || !isAuthenticated || !isMountedRef.current) return;
   
    const token = localStorage.getItem("psychicToken");
    if (!token) {
      toast.error("No authentication token found");
      logout();
      navigate("/psychic/login");
      return;
    }
    try {
      console.log("Initializing socket connection for psychic...");
     
      socketRef.current = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5000', {
        auth: {
          token: token,
          userId: psychic._id,
          role: 'psychic',
          name: psychic.name
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: true,
        autoConnect: true
      });
      // ===== SOCKET EVENT HANDLERS =====
      socketRef.current.on("connect", () => {
        console.log("✅ Socket connected as psychic:", psychic.name);
       
        // Join psychic's personal room
        socketRef.current.emit("join_room", `psychic_${psychic._id}`);
       
        // Join psychic timer room
        socketRef.current.emit("join_psychic_timer", { psychicId: psychic._id });
       
        // Join all existing chat rooms
        chatSessions.forEach(session => {
          if (!chatRoomsJoined.current.has(session._id)) {
            socketRef.current.emit("join_room", `chat_${session._id}`);
            chatRoomsJoined.current.add(session._id);
          }
        });
      });
      // ===== CALL SOCKET EVENTS =====
     
   // In your socket event handlers section
socketRef.current.on("incoming_call", (data) => {
  console.log('📞 Incoming call received by psychic:', data);
 
  // Enhanced call data with proper user info
  const enhancedCallData = {
    ...data,
    caller: {
      ...data.caller,
      // Ensure we have name from multiple possible sources
      name: data.caller?.name ||
            data.callerInfo?.name ||
            `${data.caller?.firstName || ''} ${data.caller?.lastName || ''}`.trim() ||
            'User',
      image: data.caller?.image || data.callerInfo?.image
    }
  };
 
  // Set active call
  setActiveCall(enhancedCallData);
  setCallStatus('ringing');
 
  // Start call duration timer (this will start when psychic accepts)
 
  toast.info(`Incoming call from ${enhancedCallData.caller.name}`, {
    duration: 10000,
    action: {
      label: 'Answer',
      onClick: acceptCall
    }
  });
});
      // Call accepted by user (when psychic is the caller)
      socketRef.current.on("call_accepted", (data) => {
        console.log('✅ Call accepted by user:', data);
        setCallStatus('in-progress');
       
        toast.success('Call connected!');
      });
     
      // Call rejected
      socketRef.current.on("call_rejected", (data) => {
        console.log('❌ Call rejected:', data);
        setCallStatus('ended');
        setActiveCall(null);
        clearCallDuration();
       
        toast.error(`Call rejected: ${data.reason}`);
      });
     
      // Call ended
      socketRef.current.on("call_ended", (data) => {
        console.log('📞 Call ended:', data);
        setCallStatus('ended');
        setActiveCall(null);
        clearCallDuration();
       
        toast.info(`Call ended. Duration: ${formatCountdown(data.duration)}`);
      });
     
      // Start WebRTC signaling
      socketRef.current.on("start_call", (data) => {
        console.log('🚀 Starting WebRTC call:', data);
        if (data.callId === activeCall?.callId) {
          startWebRTCCall();
        }
      });
     
      // WebRTC signaling events
      socketRef.current.on("webrtc_offer", handleWebRTCOffer);
      socketRef.current.on("webrtc_answer", handleWebRTCAnswer);
      socketRef.current.on("ice_candidate", handleICECandidate);
      // ===== TIMER EVENTS - REAL-TIME UPDATES FROM BACKEND =====
     
      // Timer tick from backend (CRITICAL - REAL-TIME UPDATES)
      socketRef.current.on("timer_tick", (data) => {
        console.log('⏰ TIMER TICK FROM BACKEND (psychic):', data);
       
        // Update countdown from backend data
        setCountdownSeconds(data.remainingSeconds);
       
        // Update active session if it matches
        if (activeSession?._id === data.requestId) {
          setActiveSession(prev => ({
            ...prev,
            paidSession: {
              ...prev?.paidSession,
              remainingSeconds: data.remainingSeconds,
              currentBalance: data.currentBalance,
              lastUpdate: new Date()
            }
          }));
        }
      });
      // Session started - sync with backend immediately
      socketRef.current.on("session_started", (data) => {
        console.log('🚀 Session started via socket (psychic side):', data);
       
        const psychicId = data.paidTimer?.psychic ||
                          data.chatRequest?.psychic?._id ||
                          data.psychic?._id ||
                          data.psychicId;
       
        if (psychicId === psychic._id) {
          console.log('✅ Matching psychic, updating UI');
         
          // Force sync with backend for accurate data
          setTimeout(() => {
            syncTimerWithBackend(true);
          }, 1000);
        }
      });
      // Timer update handler
      socketRef.current.on("timer_update", (data) => {
        console.log('🔄 TIMER UPDATE (psychic):', data);
       
        const selectedUserId = selectedSessionRef.current?.user?._id;
       
        if (activeSession?._id === data.requestId || selectedUserId === data.userId) {
          // Update timer state from backend
          setCountdownSeconds(data.remainingSeconds);
          setTimerPaused(data.isPaused || false);
         
          // Update active session
          setActiveSession(prev => ({
            ...prev,
            remainingSeconds: data.remainingSeconds,
            status: data.status,
            paidSession: {
              ...prev?.paidSession,
              remainingSeconds: data.remainingSeconds,
              isPaused: data.isPaused || false
            }
          }));
        }
      });
      // Handle timer paused/resumed
      socketRef.current.on("timer_paused", (data) => {
        console.log('⏸️ Timer paused (psychic):', data);
       
        if (activeSession?._id === data.requestId) {
          setTimerPaused(true);
          setActiveSession(prev => ({
            ...prev,
            paidSession: {
              ...prev?.paidSession,
              isPaused: true
            }
          }));
        }
      });
      socketRef.current.on("timer_resumed", (data) => {
        console.log('▶️ Timer resumed (psychic):', data);
       
        if (activeSession?._id === data.requestId) {
          setTimerPaused(false);
          setActiveSession(prev => ({
            ...prev,
            paidSession: {
              ...prev?.paidSession,
              isPaused: false
            }
          }));
        }
      });
      // Handle session ended
      socketRef.current.on("session_ended", (data) => {
        console.log('🏁 Session ended (psychic):', data);
     
        if (activeSession?._id === data.requestId) {
          setActiveSession(null);
          setCountdownSeconds(0);
          setTimerPaused(false);
         
          // Clear sync interval
          if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
          }
         
          checkActiveSession(true);
          toast.success("Session ended successfully", {
            duration: 3000
          });
        }
      });
      // Timer updated handler
      socketRef.current.on("timer_updated", (data) => {
        console.log('🔄 Timer updated via socket:', data);
       
        if (activeSession?._id === data.requestId) {
          setCountdownSeconds(data.remainingSeconds);
          setActiveSession(prev => ({
            ...prev,
            remainingSeconds: data.remainingSeconds,
            paidSession: {
              ...prev?.paidSession,
              remainingSeconds: data.remainingSeconds,
              isPaused: data.isPaused || false
            }
          }));
         
          setTimerPaused(data.isPaused || false);
        }
      });
      // ===== CHAT REQUEST EVENTS =====
// Update the socket new_chat_request handler
socketRef.current.on("new_chat_request", (data) => {
  console.log("🎯 NEW CHAT REQUEST via socket:", data);

  const { chatRequest } = data;
  if (!chatRequest) return;

  // Format user info with username
  const user = chatRequest.user || {};
  const username = user.username || 'user';
  const displayName = username 
    ? `@${username}`
    : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  
  const formattedRequest = {
    ...chatRequest,
    user: {
      ...user,
      displayName,
      username
    }
  };

  // Add to pending requests immediately
  setPendingRequests(prev => {
    if (prev.some(req => req._id === formattedRequest._id)) {
      return prev;
    }
    return [...prev, formattedRequest];
  });

  // Update notification state
  setHasNewRequest(true);
  setUnseenRequestCount(prev => prev + 1);

  // Play ringtone immediately (if not already ringing and modal not open)
  if (!isRinging && !showRequestModal) {
    console.log('🔔 Starting ringtone for new request');
    startRinging();
  }

  // Immediately update chat sessions to show the request
  setChatSessions(prev => {
    const sessionIndex = prev.findIndex(
      s => s.user?._id === formattedRequest.user?._id
    );
   
    if (sessionIndex !== -1) {
      // Update existing session
      const updatedSessions = [...prev];
      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        hasPendingRequest: true,
        status: 'pending', // Mark as pending
        updatedAt: new Date()
      };
      // Move to top
      const [session] = updatedSessions.splice(sessionIndex, 1);
      updatedSessions.unshift(session);
      return updatedSessions;
    } else {
      // Create a new session for this user
      const newSession = {
        _id: `pending_${formattedRequest._id}`,
        user: formattedRequest.user,
        psychic: psychic._id,
        status: 'pending',
        hasPendingRequest: true,
        lastMessage: null,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return [newSession, ...prev];
    }
  });

  // Show notification toast with username
  toast.success(`New chat request from ${displayName}`, {
    duration: 5000,
    action: {
      label: 'View',
      onClick: () => {
        // Show the request immediately
        setRequestToShow(formattedRequest);
        setUserForRequest(formattedRequest.user);
        setShowRequestModal(true);
        stopRinging(); // Stop ringtone when viewing
      }
    }
  });
});
      // ===== MESSAGE HANDLING EVENTS =====
      socketRef.current.on("new_message", (data) => {
        console.log("📨 INCOMING MESSAGE:", data);
       
        const { message, chatSessionId, senderId, senderRole } = data;
       
        if (!message || !chatSessionId || senderRole === 'psychic') {
          return;
        }
        // Play message notification sound (different from ringtone)
        try {
          if (messageAudioRef.current) {
            messageAudioRef.current.currentTime = 0;
            messageAudioRef.current.play().catch(() => {});
          }
        } catch (err) {
          console.log("Message audio play failed:", err);
        }
        // Update messages state
        setMessages(prev => {
          const existingMessages = prev[chatSessionId] || [];
         
          if (existingMessages.some(m => m._id === message._id)) {
            return prev;
          }
         
          const updatedMessages = [...existingMessages, message];
         
          updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
         
          return {
            ...prev,
            [chatSessionId]: updatedMessages
          };
        });
        // Update chat sessions
        setChatSessions(prev => {
          const sessionIndex = prev.findIndex(s => s._id === chatSessionId);
          if (sessionIndex === -1) {
            fetchChats();
            return prev;
          }
         
          const updatedSessions = [...prev];
          const isCurrentSession = selectedSessionRef.current?._id === chatSessionId;
         
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            lastMessage: message,
            lastMessageAt: new Date(),
            unreadCounts: {
              ...updatedSessions[sessionIndex].unreadCounts,
              psychic: isCurrentSession ? 0 : (updatedSessions[sessionIndex].unreadCounts?.psychic || 0) + 1
            }
          };
         
          const [session] = updatedSessions.splice(sessionIndex, 1);
          updatedSessions.unshift(session);
         
          return updatedSessions;
        });
        // Mark as read if this chat is open
        if (selectedSessionRef.current?._id === chatSessionId) {
          socketRef.current.emit("message_read", {
            messageId: message._id,
            chatSessionId
          });
        } else {
          const userName = message.sender?.name || 'User';
          toast.info(`New message from ${userName}`, {
            duration: 3000,
            action: {
              label: 'View',
              onClick: () => {
                const session = chatSessions.find(s => s._id === chatSessionId);
                if (session) {
                  handleSelectSession(session);
                  if (isMobileView) setShowChatList(false);
                }
              }
            }
          });
        }
      });
      // Handle typing indicators
      socketRef.current.on("typing_indicator", (data) => {
        const { chatSessionId, userId, isTyping: typing } = data;
       
        if (selectedSessionRef.current?._id === chatSessionId && userId !== psychic._id) {
          setIsTyping(typing);
         
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
         
          if (typing) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      });
      // Handle online status
      socketRef.current.on("online_status_response", (data) => {
        setOnlineStatus(data);
      });
      socketRef.current.on("user_status_change", (data) => {
        const { userId, status } = data;
       
        setOnlineStatus(prev => ({
          ...prev,
          [userId]: status === 'online'
        }));
      });
      // Connect socket
      socketRef.current.connect();
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      toast.error("Failed to connect to chat server");
    }
    return () => {
      if (socketRef.current && !isMountedRef.current) {
        console.log("Cleaning up socket connection");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [psychic, isAuthenticated, navigate, logout, chatSessions, syncTimerWithBackend, activeSession, activeCall]);
  // ========== TIMER DEBUG EFFECT ==========
  useEffect(() => {
    console.log('🔍 PSYCHIC TIMER DEBUG - State values:', {
      hasActiveSession: !!activeSession,
      activeSessionStatus: activeSession?.status,
      countdownSeconds: countdownSeconds,
      backendCountdown: activeSession?.paidSession?.remainingSeconds,
      timerPaused: timerPaused,
      syncIntervalActive: !!syncTimerRef.current
    });
  }, [activeSession, countdownSeconds, timerPaused]);
  // ========== FORCE TIMER REFRESH FUNCTION ==========
  const forceTimerRefresh = useCallback(async () => {
    if (!selectedSession || !psychic) return;
   
    try {
      console.log('🔄 Force refreshing timer for psychic');
      setIsRefreshingTimer(true);
     
      // Check active session from API
      const response = await chatApi.get('/api/chatrequest/active-session-psychic');
     
      if (response.data.success && response.data.data) {
        const sessionData = response.data.data;
       
        // Check if this session is for the current user
        const sessionUserId = sessionData.user?._id || sessionData.userId;
        const selectedUserId = selectedSession?.user?._id;
       
        if (sessionUserId === selectedUserId && sessionData.status === 'active') {
          console.log('✅ Found matching active session, updating timer');
         
          setActiveSession(sessionData);
         
          // Get timer data from backend
          const timerResponse = await chatApi.get(`/api/chatrequest/timer/${sessionData._id}`);
          if (timerResponse.data.success) {
            const timerData = timerResponse.data.data;
            setCountdownSeconds(timerData.remainingSeconds);
            setTimerPaused(timerData.isPaused || false);
          }
         
          toast.success('Timer refreshed', {
            duration: 2000
          });
        }
      }
    } catch (error) {
      console.error('Error force refreshing timer:', error);
    } finally {
      setIsRefreshingTimer(false);
    }
  }, [selectedSession, psychic, chatApi]);
  // Fetch messages for selected session

 // In your PsychicChats component - Update fetchMessages
const fetchMessages = useCallback(async (sessionId) => {
  if (!sessionId || !psychic || !isAuthenticated) return;

  try {
    const { data } = await chatApi.get(`/api/psychic/messages/${sessionId}`);
  
    if (data.success && isMountedRef.current) {
      // Format messages with username display
      const formattedMessages = (data.messages || []).map(message => {
        const isPsychic = message.senderModel === 'Psychic';
        
        // Get display name based on sender
        let displayName = '';
        let username = '';
        
        if (isPsychic) {
          displayName = psychic.name || 'You';
          username = psychic.username || psychic.name?.toLowerCase()?.replace(/\s+/g, '') || 'psychic';
        } else {
          // For user messages
          if (message.sender?.username) {
            displayName = `@${message.sender.username}`;
            username = message.sender.username;
          } else if (message.sender?.firstName || message.sender?.lastName) {
            displayName = `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim();
            username = message.sender.username || 'user';
          } else {
            displayName = 'User';
            username = 'user';
          }
        }
        
        return {
          ...message,
          displayName,
          username
        };
      });
      
      const sortedMessages = formattedMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
     
      setMessages(prev => ({
        ...prev,
        [sessionId]: sortedMessages
      }));
    
      await chatApi.put(`/api/psychic/messages/${sessionId}/read`);
    
      setChatSessions(prev =>
        prev.map(session =>
          session._id === sessionId
            ? { ...session, unreadCounts: { ...session.unreadCounts, psychic: 0 } }
            : session
        )
      );
    
      if (socketRef.current?.connected && !chatRoomsJoined.current.has(sessionId)) {
        socketRef.current.emit("join_room", `chat_${sessionId}`);
        chatRoomsJoined.current.add(sessionId);
      }
    }
  } catch (err) {
    console.error("Failed to load messages", err);
    toast.error("Failed to load messages");
  }
}, [psychic, isAuthenticated, chatApi]);
  // Fetch messages when session is selected
  useEffect(() => {
    if (selectedSession && isMountedRef.current) {
      fetchMessages(selectedSession._id);
    }
  }, [selectedSession, fetchMessages]);
  // Auto scroll to bottom when messages change
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
  // ========== MESSAGE FUNCTIONS ==========
  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setIsTyping(false);
    setTypingUser(null);
   
    clearTimeout(typingTimeoutRef.current);
   
    if (isMobileView) {
      setShowChatList(false);
    }
  };
  const handleBackToChatList = () => {
    if (isMobileView) {
      setShowChatList(true);
      setSelectedSession(null);
      setIsTyping(false);
      setTypingUser(null);
    }
  };
  const handleSend = async () => {
    // Check if timer is active and not paused
    if (!activeSessionForUser) {
      toast.error("Paid session is required to send messages");
      return;
    }
   
    if (timerPaused) {
      toast.error("Cannot send messages while session is paused");
      return;
    }
   
    const messageContent = input.trim();
    if (!messageContent || !selectedSession || !psychic) {
      return;
    }
    // Create temporary message for optimistic update
    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      _id: tempMessageId,
      tempId: tempMessageId,
      content: messageContent,
      chatSession: selectedSession._id,
      sender: {
        _id: psychic._id,
        name: psychic.name,
        image: psychic.image
      },
      senderModel: 'Psychic',
      messageType: 'text',
      status: 'sending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    // Optimistic update
    setMessages(prev => ({
      ...prev,
      [selectedSession._id]: [...(prev[selectedSession._id] || []), tempMessage]
    }));
    setChatSessions(prev =>
      prev.map(session =>
        session._id === selectedSession._id
          ? {
              ...session,
              lastMessage: tempMessage,
              lastMessageAt: new Date(),
            }
          : session
      )
    );
    setInput("");
    // Clear typing indicator
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing", {
        chatSessionId: selectedSession._id,
        isTyping: false
      });
    }
    // Send to server
    try {
      const { data } = await chatApi.post('/api/psychic/messages', {
        chatSessionId: selectedSession._id,
        content: messageContent,
        messageType: "text",
      });
      if (data.success && data.message) {
        const newMessage = data.message;
       
        // Replace temp message with real one
        setMessages(prev => {
          const sessionMessages = prev[selectedSession._id] || [];
          const updatedMessages = sessionMessages.map(msg =>
            msg.tempId === tempMessageId ? newMessage : msg
          );
         
          return {
            ...prev,
            [selectedSession._id]: updatedMessages
          };
        });
        // Update session with real message
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
        // Emit socket event
        if (socketRef.current?.connected) {
          socketRef.current.emit("send_message", {
            chatSessionId: selectedSession._id,
            message: newMessage,
            senderId: psychic._id,
            senderRole: 'psychic'
          });
        }
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Failed to send message", err);
     
      // Update message status to failed
      setMessages(prev => {
        const sessionMessages = prev[selectedSession._id] || [];
        const updatedMessages = sessionMessages.map(msg =>
          msg.tempId === tempMessageId
            ? { ...msg, status: 'failed', error: err.message }
            : msg
        );
       
        return {
          ...prev,
          [selectedSession._id]: updatedMessages
        };
      });
     
      toast.error(err.response?.data?.message || "Failed to send message");
    }
    // Focus input again
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
   
    if (selectedSession && socketRef.current?.connected) {
      clearTimeout(typingTimeoutRef.current);
     
      socketRef.current.emit("typing", {
        chatSessionId: selectedSession._id,
        isTyping: value.length > 0
      });
     
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit("typing", {
            chatSessionId: selectedSession._id,
            isTyping: false
          });
        }
      }, 2000);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleRefresh = () => {
    fetchChats();
    if (selectedSession) {
      fetchMessages(selectedSession._id);
      checkActiveSession(true);
    }
  };
  const handleRetryMessage = async (message) => {
    if (!selectedSession) return;
   
    try {
      const { data } = await chatApi.post('/api/psychic/messages', {
        chatSessionId: selectedSession._id,
        content: message.content,
        messageType: "text",
      });
      if (data.success && data.message) {
        const newMessage = data.message;
       
        setMessages(prev => {
          const sessionMessages = prev[selectedSession._id] || [];
          const updatedMessages = sessionMessages.map(msg =>
            msg._id === message._id ? newMessage : msg
          );
         
          return {
            ...prev,
            [selectedSession._id]: updatedMessages
          };
        });
        if (socketRef.current?.connected) {
          socketRef.current.emit("send_message", {
            chatSessionId: selectedSession._id,
            message: newMessage,
            senderId: psychic._id,
            senderRole: 'psychic'
          });
        }
      }
    } catch (err) {
      console.error("Failed to resend message", err);
      toast.error("Failed to resend message");
    }
  };
  // ========== TIMER CONTROL FUNCTIONS ==========
const handleSessionEnd = async () => {
  if (!activeSession) return;
  try {
    const response = await chatApi.post('/api/chatrequest/stop-timer-psychic', {
      requestId: activeSession._id
    });
 
    if (response.data.success) {
      setActiveSession(null);
      setCountdownSeconds(0);
      setTimerPaused(false);
     
      // Clear sync interval
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
     
      checkActiveSession(true);
      toast.success("Session ended successfully");
    } else {
      throw new Error(response.data.message || "Failed to end session");
    }
  } catch (error) {
    console.error('Error ending session:', error);
   
    // Show specific error message
    const errorMessage = error.response?.data?.message ||
                        error.message ||
                        "Failed to end session";
   
    toast.error(errorMessage);
   
    // Still update UI even if backend fails
    setActiveSession(null);
    setCountdownSeconds(0);
    setTimerPaused(false);
   
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }
};
  const handlePauseTimer = async () => {
    if (!activeSession) return;
   
    try {
      const response = await chatApi.post('/api/chatrequest/pause-timer-psychic', {
        requestId: activeSession._id
      });
    
      if (response.data.success) {
        setTimerPaused(true);
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            isPaused: true
          }
        }));
       
        toast.success('Session paused');
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Failed to pause session');
    }
  };
  const handleResumeTimer = async () => {
    if (!activeSession) return;
   
    try {
      const response = await chatApi.post('/api/chatrequest/resume-timer-psychic', {
        requestId: activeSession._id
      });
    
      if (response.data.success) {
        setTimerPaused(false);
        setActiveSession(prev => ({
          ...prev,
          paidSession: {
            ...prev?.paidSession,
            isPaused: false
          }
        }));
       
        toast.success('Session resumed');
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast.error('Failed to resume session');
    }
  };
  // ========== FIXED REQUEST HANDLING FUNCTIONS ==========
 const handleViewRequest = () => {
  console.log('🔔 View Request clicked');
  console.log('Pending requests:', pendingRequests);
  console.log('Selected user:', selectedUser);
  console.log('Has pending request:', hasPendingRequest);
 
  // Stop ringtone when viewing request
  if (isRinging) {
    stopRinging();
  }
 
  // Try to get request for current user first
  if (hasPendingRequest && selectedUser) {
    const requestForCurrentUser = pendingRequests.find(
      req => req.user?._id === selectedUser._id
    );
   
    if (requestForCurrentUser) {
      console.log('Found request for current user:', requestForCurrentUser);
      setRequestToShow(requestForCurrentUser);
      setUserForRequest(selectedUser);
      setShowRequestModal(true);
      return;
    }
  }
 
  // If no request for current user, show first pending request
  if (pendingRequests.length > 0) {
    const firstRequest = pendingRequests[0];
    console.log('Showing first pending request:', firstRequest);
    setRequestToShow(firstRequest);
    setUserForRequest(firstRequest.user);
   
    // Optional: Auto-select the session for this user
    const matchingSession = chatSessions.find(
      s => s.user?._id === firstRequest.user?._id
    );
    if (matchingSession && !selectedSession) {
      handleSelectSession(matchingSession);
    }
   
    setShowRequestModal(true);
  } else {
    toast.error("No pending requests found");
  }
};
  const handleRequestAccepted = (requestData) => {
  console.log('Request accepted:', requestData);
 
  // Clear notification state
  setHasNewRequest(false);
  setUnseenRequestCount(0);
 
  // Stop ringing
  stopRinging();
 
  const enhancedRequestData = {
    ...requestData,
    status: 'active',
    user: requestData.user || { _id: requestData.userId }
  };
 
  setActiveSession(enhancedRequestData);
  setPendingRequests(prev =>
    prev.filter(req => req._id !== requestData._id)
  );
  setShowRequestModal(false);
  setRequestToShow(null);
  setUserForRequest(null);
 
  // Start backend sync for this session
  setTimeout(() => {
    syncTimerWithBackend(true);
  }, 1000);
 
  if (socketRef.current?.connected) {
    socketRef.current.emit('request_accepted', {
      requestId: requestData._id,
      userId: requestData.user?._id,
      psychicId: psychic._id
    });
  }
};
const handleRequestRejected = (requestId) => {
  // Update notification count
  setUnseenRequestCount(prev => Math.max(0, prev - 1));
  if (unseenRequestCount - 1 <= 0) {
    setHasNewRequest(false);
    stopRinging();
  }
 
  setPendingRequests(prev => prev.filter(req => req._id !== requestId));
  setShowRequestModal(false);
  setRequestToShow(null);
  setUserForRequest(null);
 
  if (socketRef.current?.connected) {
    socketRef.current.emit('request_rejected', {
      requestId,
      userId: requestToShow?.user?._id,
      psychicId: psychic._id
    });
  }
};
  // Manual ringtone control button
  const handleStopRingingClick = () => {
    stopRinging();
    // Also clear all pending requests (optional)
    setPendingRequests([]);
  };
  // Filter sessions
  const filteredSessions = chatSessions.filter((session) => {
    const userName = `${session.user?.firstName || ''} ${session.user?.lastName || ''}`.toLowerCase();
    const username = session.user?.username?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
  
    return userName.includes(query) || username.includes(query);
  });
  // ========== COMPUTED VALUES ==========


  // Emoji handler
  const handleEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji.native + " ");
    setShowEmojiPicker(false);
    // Focus back on input after emoji selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
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
  // ========== MAIN RENDER ==========
  return (
    <div className="h-screen bg-[#f0f2f5] overflow-hidden">
      {/* Incoming Call Notification */}
      <IncomingCallNotification
      activeCall={activeCall}
      callStatus={callStatus}
      onAccept={acceptCall}
      onReject={rejectCall}
    />
     
<ActiveCallUI
  activeCall={activeCall}
  callStatus={callStatus}
  onEndCall={endCall} // Make sure this is the fixed function
  onToggleMute={toggleMute}
  onToggleSpeaker={toggleSpeaker}
  isMuted={isMuted}
  isSpeaker={isSpeaker}
  callDuration={callDuration}
  creditsEarned={realTimeCallData.creditsEarned}
  ratePerMin={realTimeCallData.ratePerMin}
  nextEarningIn={realTimeCallData.nextEarningIn}
/>
      <div className="flex h-full">
        {/* Chat List Sidebar */}
        <div className={cn(
          "flex flex-col w-full md:w-96 bg-white border-r border-[#e9edef] transition-all duration-300 ease-in-out h-full",
          showChatList ? "flex" : "hidden md:flex"
        )}>
          {/* Header */}
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

                {/* Add this in your chat header, near the psychic name */}
<div className="flex items-center gap-2 ml-2">
  {/* Status indicator with colored dot */}
  <div className="flex items-center gap-1">
    <div className={`h-2 w-2 rounded-full ${
      psychicStatus === 'busy' ? 'bg-orange-500' : 
      psychicStatus === 'online' ? 'bg-green-500' : 
      'bg-gray-400'
    }`} />
    <span className="text-xs font-medium capitalize">
      {psychicStatus}
    </span>
  </div>

  {/* Online Button */}
  <Button
    onClick={handleSetOnline}
    disabled={isUpdatingStatus || psychicStatus === 'online'}
    variant={psychicStatus === 'online' ? "default" : "outline"}
    size="sm"
    className="h-6 px-2 text-xs border-green-300 text-green-600 hover:bg-green-50 data-[state=on]:bg-green-600 data-[state=on]:text-white"
  >
    {isUpdatingStatus && psychicStatus !== 'online' ? (
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : psychicStatus === 'online' ? (
      <>
        <div className="h-2 w-2 rounded-full bg-white mr-1" />
        Online ✓
      </>
    ) : (
      "Go Online"
    )}
  </Button>

  {/* Busy Button */}
  <Button
    onClick={handleSetBusy}
    disabled={isUpdatingStatus || psychicStatus === 'busy'}
    variant={psychicStatus === 'busy' ? "default" : "outline"}
    size="sm"
    className="h-6 px-2 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 data-[state=on]:bg-orange-600 data-[state=on]:text-white"
  >
    {isUpdatingStatus && psychicStatus !== 'busy' ? (
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : psychicStatus === 'busy' ? (
      <>
        <div className="h-2 w-2 rounded-full bg-white mr-1" />
        Busy ✓
      </>
    ) : (
      "Set Busy"
    )}
  </Button>

  {/* Optional: Status info badge */}
  {activeSessionForUser && psychicStatus === 'busy' && (
    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
      Live Session
    </Badge>
  )}
</div>
              </div>
              <div className="flex items-center gap-2">
                {/* Ringing Indicator */}
              {/* Updated Bell Icon section in the header */}
<div className="relative">
  <Button
    variant="ghost"
    size="icon"
    onClick={() => {
      // Check for new requests
      checkNewChatRequests();
     
      // Stop ringtone when bell is clicked
      if (isRinging) {
        stopRinging();
      }
     
      // If there are requests, show the modal
      if (pendingRequests.length > 0) {
        setRequestToShow(pendingRequests[0]);
        setUserForRequest(pendingRequests[0].user);
        setShowRequestModal(true);
      } else {
        toast.info("No new chat requests");
      }
    }}
    className={cn(
      "h-10 w-10 transition-all duration-300",
      hasNewRequest
        ? "text-amber-600 hover:text-amber-700 ring-2 ring-amber-500 ring-offset-2"
        : "text-gray-500 hover:text-gray-700"
    )}
    title={hasNewRequest ? `${unseenRequestCount} new request(s)` : "Check requests"}
  >
    <Bell className="h-5 w-5" />
  </Button>
 
  {/* Notification Badge */}
  {hasNewRequest && (
    <div className="absolute -top-1 -right-1">
      <span className="relative flex h-5 w-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {unseenRequestCount > 9 ? '9+' : unseenRequestCount}
        </span>
      </span>
    </div>
  )}
 
  {/* Ringing indicator */}
  {isRinging && (
    <div className="absolute -top-1 -left-1">
      <div className="h-6 w-6 rounded-full bg-green-500 border-2 border-white animate-ping"></div>
    </div>
  )}
</div>
               
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-10 w-10 text-gray-500 hover:text-gray-700"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
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
          
            {/* Search */}
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
          {/* Request Notification Panel - Add this below the search bar */}
{hasNewRequest && pendingRequests.length > 0 && (
  <div className="mx-3 mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-amber-800">
            New Chat Request{unseenRequestCount > 1 ? 's' : ''}!
          </h3>
          <p className="text-sm text-amber-600">
            {unseenRequestCount} user{unseenRequestCount > 1 ? 's are' : ' is'} waiting to chat with you
          </p>
        </div>
      </div>
      <Button
        onClick={() => {
          setRequestToShow(pendingRequests[0]);
          setUserForRequest(pendingRequests[0].user);
          setShowRequestModal(true);
          // Stop ringtone when viewing
          if (isRinging) {
            stopRinging();
          }
        }}
        className="bg-amber-600 hover:bg-amber-700"
        size="sm"
      >
        View Now
      </Button>
    </div>
  </div>
)}
          {/* Chat List */}
          <ScrollArea className="flex-1 bg-white">
            <div className="p-1">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-[#f5f6f6] flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No chats yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {searchQuery ? "No users match your search" : "Users will appear here when they message you"}
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const hasActiveRequest = activeSession?.user?._id === session.user?._id &&
                                          activeSession?.status === 'active';
                  const hasPendingRequestForSession = pendingRequests.some(req => req.user?._id === session.user?._id);
                 
                  return (
                    <div
                      key={session._id}
                      onClick={() => handleSelectSession(session)}
                      className={cn(
                        "flex items-center p-3 hover:bg-[#f5f6f6] cursor-pointer border-b border-[#f0f2f5]",
                        selectedSession?._id === session._id && "bg-[#f0f2f5]",
                        hasActiveRequest && "border-l-4 border-l-[#00a884]",
                        hasPendingRequestForSession && "border-l-4 border-l-[#ffcc00]"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={session.user?.image} />
                          <AvatarFallback className="bg-[#2A4A9C] text-white font-medium">
                            {session.user?.firstName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {onlineStatus[session.user?._id] && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                        {hasActiveRequest && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-white font-bold">$</span>
                          </div>
                        )}
                        {hasPendingRequestForSession && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center animate-pulse">
                            <Bell className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold text-gray-800 text-sm truncate">
                            {session.user?.username} 
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatLastMessageTime(session.lastMessageAt)}
                          </span>
                        </div>
                      
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <p className="text-sm text-gray-600 truncate max-w-[180px]">
                              {hasActiveRequest ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Clock className="h-3 w-3" />
                                  Paid session: {formatCountdown(countdownSeconds)}
                                </span>
                              ) : hasPendingRequestForSession ? (
                                <span className="flex items-center gap-1 text-yellow-600 animate-pulse">
                                  <Bell className="h-3 w-3" />
                                  Incoming request!
                                </span>
                              ) : session.lastMessage?.content || "No messages yet"}
                            </p>
                            {session.unreadCounts?.psychic > 0 && (
                              <span className="ml-1">•</span>
                            )}
                          </div>
                          {session.unreadCounts?.psychic > 0 && (
                            <span className="bg-[#00a884] text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                              {session.unreadCounts.psychic}
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
              {/* UNIFIED CHAT HEADER - UPDATED WITH CALL BUTTONS */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="px-4 py-3">
                  {/* Top Row: Chat Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {isMobileView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBackToChatList}
                          className="md:hidden text-gray-600 hover:text-gray-900"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </Button>
                      )}
                     
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {selectedUser?.firstName?.[0] || 'U'}
                        </div>
                        {hasPendingRequest && !activeSessionForUser && (
                          <div className="absolute -top-1 -right-1">
                            <Badge className="bg-amber-500 text-white animate-pulse px-2 py-0.5 text-xs">
                              <Bell className="h-2 w-2 mr-1" />
                              Request
                            </Badge>
                          </div>
                        )}
                        {/* Ringing indicator in header */}
                        {hasPendingRequest && !activeSessionForUser && (isRinging || hasUnseenRequest) && (
                          <div className="absolute -bottom-1 -right-1">
                            <div className="h-5 w-5 rounded-full bg-red-500 border-2 border-white animate-ping"></div>
                          </div>
                        )}
                      </div>
                     
                      <div>
<div className="flex items-center gap-2">
  <div className="flex flex-col">
    {/* Show username with @ symbol */}
    <h2 className="font-bold text-lg text-gray-800">
      {selectedUser?.username 
        ? `${selectedUser.username}`
        : `${selectedUser?.firstName} ${selectedUser?.lastName}`.trim()
      }
    </h2>
    
   
  </div>
  
  {/* <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
    <User className="h-3 w-3 mr-1" />
    {selectedUser?.username }
  </Badge> */}
</div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <CreditCard className="h-3 w-3" />
                            <span className="font-medium">Credit {psychic?.ratePerMin || 1}/min</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={forceTimerRefresh}
                            disabled={isRefreshingTimer}
                            className="h-6 px-2"
                            title="Refresh timer"
                          >
                            <RefreshCw className={`h-3 w-3 ${isRefreshingTimer ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                   
                    {/* Call buttons for psychic */}
                    <div className="flex items-center gap-2">
                      {hasPendingRequest && !activeSessionForUser && (isRinging || hasUnseenRequest) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStopRingingClick}
                          className="border-red-300 text-red-600 hover:bg-red-50 animate-pulse"
                        >
                          <BellOff className="h-4 w-4 mr-2" />
                          Stop Ringing
                        </Button>
                      )}
                     
                      {/* Call button - disabled when no active session */}
                      {activeSessionForUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-gray-500 hover:text-gray-700"
                          disabled={!activeSessionForUser}
                          title={activeSessionForUser ? "Audio Call" : "Start session to enable calls"}
                          onClick={() => {
                            toast.info("Users can initiate calls from their side when session is active");
                          }}
                        >
                          <Phone className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                 
                  {/* Bottom Row: Timer Controls */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      {/* Status Panel */}
                      <div className="p-4 border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`
                            h-3 w-3 rounded-full flex-shrink-0
                            ${activeSession?.status === 'active' && activeSessionForUser ? 'bg-green-500 animate-pulse' :
                              pendingRequests.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}
                          `}></div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {activeSession?.status === 'active' && activeSessionForUser ? 'Active Session' :
                               pendingRequests.length > 0 ? `Request Pending (${pendingRequests.length})` : 'Ready'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activeSession?.status === 'active' && activeSessionForUser ?
                                `With ${selectedUser?.firstName}` :
                               pendingRequests.length > 0 ?
                                `${pendingRequests.length} new chat request(s)!` :
                                'Awaiting request'}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Timer Panel */}
                      {activeSession?.status === 'active' && activeSessionForUser && (
                        <div className="p-4 border-r border-gray-100 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Time Remaining</div>
                              <div className="text-2xl font-bold text-gray-800 font-mono">
                                {formatCountdown(countdownSeconds)}
                              </div>
                            </div>
                            <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                              LIVE
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Action Panel */}
                    {/* Action Panel - FIXED FOR MOBILE */}
<div className="p-4">
  {activeSession?.status === 'active' && activeSessionForUser ? (
    <Button
      onClick={async () => {
        if (!window.confirm("Are you sure you want to end this paid session?")) {
          return;
        }
        try {
          await handleSessionEnd();
        } catch (error) {
          console.error('Error ending session:', error);
          toast.error("Failed to end session");
        }
      }}
      variant="outline"
      className="w-full border-red-300 text-red-600 hover:bg-red-50"
      size="sm"
      disabled={!activeSessionForUser}
    >
      <StopCircle className="mr-2 h-4 w-4" />
      End Session
    </Button>
  ) : pendingRequests.length > 0 ? (
    <Button
      onClick={() => {
        handleViewRequest();
        // Stop ringtone when viewing request
        if (isRinging) {
          stopRinging();
        }
      }}
      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse"
      size="sm"
    >
      <Bell className="mr-2 h-4 w-4" />
      View Request ({pendingRequests.length})
    </Button>
  ) : (
    <div className="text-center py-2">
      <div className="text-sm text text-gray-500">Ready to chat</div>
    </div>
  )}
</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Messages Area */}
              <ScrollArea
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto"
              >
                <div className="p-4">
                  <div className="space-y-2 max-w-3xl mx-auto">
                    {currentMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-sm">
                          <Sparkles className="h-8 w-8 text-[#00a884]" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          {activeSessionForUser ? "Paid Session Active!" :
                           pendingRequests.length > 0 ? "Request Pending..." :
                           "Start een gesprek"}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          {activeSessionForUser
                            ? `Paid session is active. Timer: ${formatCountdown(countdownSeconds)}`
                            : pendingRequests.length > 0
                            ? `Waiting for you to accept the chat request...`
                            : `Send your first message to ${selectedUser?.firstName}`
                          }
                        </p>
                        {/* Visual ringtone indicator */}
                        {pendingRequests.length > 0 && (isRinging || hasUnseenRequest) && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg animate-pulse">
                            <div className="flex items-center justify-center gap-2">
                              <Bell className="h-5 w-5 text-red-600 animate-bounce" />
                              <span className="text-sm font-medium text-red-600">
                                INCOMING CHAT REQUEST - ANSWER NOW!
                              </span>
                              <Bell className="h-5 w-5 text-red-600 animate-bounce" />
                            </div>
                          </div>
                        )}
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
  
  // Get display info - prefer username from backend or format locally
  const displayName = msg.displayName || 
                     (isPsychic 
                       ? psychic?.name || 'You'
                       : (msg.sender?.username 
                          ? `${msg.sender.username}` 
                          : `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim() || 'User'));
  
  const username = msg.username || 
                  (isPsychic 
                    ? psychic?.username || psychic?.name?.toLowerCase()?.replace(/\s+/g, '') || 'psychic'
                    : msg.sender?.username || 'user');
  
  return (
    <div
      key={msg._id || msg.tempId}
      className={cn(
        "flex",
        isPsychic ? "justify-end" : "justify-start"
      )}
    >
      <div className="max-w-[65%]">
        {/* User info above message - Only show for user messages */}
        {!isPsychic && (
          <div className="flex items-center gap-1 mb-1 ml-1">
            {/* Show username prominently */}
            <span className="text-xs font-medium text-gray-700">
              {msg.sender?.username ? `${msg.sender.username}` : displayName}
            </span>
            
            {/* If we have both username and name, show name in smaller text */}
            {msg.sender?.username && (msg.sender?.firstName || msg.sender?.lastName) && (
              <>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">
                  {`${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim()}
                </span>
              </>
            )}
          </div>
        )}
        
        {/* Message bubble */}
        <div
          className={cn(
            "px-3 py-2 rounded-lg relative",
            isPsychic
              ? "bg-[#d9fdd3] rounded-br-none"
              : "bg-white rounded-bl-none shadow-sm",
            msg.status === 'failed' && "border border-red-300"
          )}
        >
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {msg.content}
          </p>
         
          {/* Message time and status */}
          <div className={cn(
            "flex items-center gap-1 mt-1 text-xs",
            isPsychic ? "justify-end" : "justify-start"
          )}>
            <span className="text-gray-500">
              {formatMessageTime(msg.createdAt)}
            </span>
            {isPsychic && (
              <>
                <span className="ml-1">
                  {getStatusIcon(msg.status)}
                </span>
                {msg.status === 'failed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 px-1 text-red-500 hover:text-red-600"
                    onClick={() => handleRetryMessage(msg)}
                  >
                    Retry
                  </Button>
                )}
              </>
            )}
          </div>
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
                                <span className="text-xs text-gray-500">{selectedUser?.firstName} is typing...</span>
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
              
              {/* Message Input Area - WITH EMOJI PICKER */}
              <div className="bg-[#f0f2f5] p-3 relative">
                <div className="flex items-center gap-2">
                  {/* Emoji Picker Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-500 hover:text-gray-700 relative"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    type="button"
                    disabled={!activeSessionForUser || timerPaused}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  
                  {/* Emoji Picker Modal */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-0 z-50">
                      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                        <Picker
                          data={data}
                          onEmojiSelect={handleEmojiSelect}
                          theme="light"
                          previewPosition="none"
                          skinTonePosition="none"
                          navPosition="bottom"
                          perLine={8}
                          maxFrequentRows={1}
                          emojiButtonSize={32}
                          emojiSize={20}
                        />
                      </div>
                    </div>
                  )}
                 
                  <div className="flex-1 relative">
                   <Input
  ref={inputRef}
  placeholder={
    activeSessionForUser 
      ? "Type a message (Paid session active)" 
      : "Type a message (Paid session required)"
  }
  value={input}
  onChange={(e) => {
    setInput(e.target.value);
    
    // Auto set to busy when typing in active session
    if (activeSessionForUser && e.target.value.length > 0 && psychicStatus !== 'busy') {
      updateStatusToBusy();
    }
  }}
  onFocus={() => {
    // Set to busy when input is focused during active session
    if (activeSessionForUser && psychicStatus !== 'busy') {
      updateStatusToBusy();
    }
  }}
  onBlur={() => {
    // Only revert to online if no session active
    if (!activeSessionForUser && psychicStatus === 'busy') {
      updateStatusToOnline();
    }
  }}
  onKeyDown={handleKeyDown}
  className="h-12 pl-4 pr-12 bg-white border-none rounded-full focus-visible:ring-0"
  disabled={!activeSessionForUser}
/>
                    
                    {!activeSessionForUser && (
                      <div className="absolute inset-0 bg-gray-100/80 rounded-full flex items-center justify-center">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          Paid session required to send messages
                        </span>
                      </div>
                    )}
                    
                    {activeSessionForUser && timerPaused && (
                      <div className="absolute inset-0 bg-gray-100/80 rounded-full flex items-center justify-center">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <Pause className="h-3 w-3" />
                          Session is paused - resume to send messages
                        </span>
                      </div>
                    )}
                    
                    {/* Emoji indicator in input when text is emoji-only */}
                    {containsOnlyEmoji(input) && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-lg">🎯</span>
                      </div>
                    )}
                  </div>
                 
                  {/* Send Button */}
                  {activeSessionForUser && !timerPaused && input.trim() && (
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="h-12 w-12 rounded-full bg-[#2A4A9C] hover:bg-[#2A4A9C]/90"
                    >
                      <Send className="h-5 w-5 text-white" />
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
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>End-to-end encrypted</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Request Modal - FIXED */}
      {requestToShow && (
        <PsychicChatRequestModal
          request={requestToShow}
          user={userForRequest}
          psychic={psychic}
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setRequestToShow(null);
            setUserForRequest(null);
          }}
          onAccepted={handleRequestAccepted}
          onRejected={handleRequestRejected}
        />
      )}
      
      <style jsx>{`
        .bg-chat-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e1e1e1' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
};

export default PsychicChats;