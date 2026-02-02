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
  Sparkles,
  Shield,
  Star,
  Check,
  CheckCheck,
  Clock,
  Smile,
  AlertCircle,
  CreditCard,
  Zap,
  User,
  DollarSign,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "@/All_Components/screen/AuthContext";
import { toast } from "sonner";

// ========== IMPORT COMPONENTS ==========
import ChatRequestModal from "./ChatRequestModal";
import RatingModal from "./RatingModal";
import Picker from "@emoji-mart/react"; // Emoji picker
import PaymentModal from "@/All_Components/PaymentModal";
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
  } else if (diffInHours < 168) { // 7 days
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

// ========== COUNTDOWN FORMATTER ==========
const formatCountdown = (seconds) => {
  if (!seconds || seconds <= 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

// ========== END UTILITY FUNCTIONS ==========

// Credit Progress Bar Component
const CreditProgressBar = ({ currentCredits, ratePerMin }) => {
  const maxCredits = Math.max(currentCredits, ratePerMin * 5); // Show 5 minutes worth
  const percentage = maxCredits > 0 ? (currentCredits / maxCredits) * 100 : 0;
  const minutesLeft = ratePerMin > 0 ? Math.floor(currentCredits / ratePerMin) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600">Credits</span>
        <span className="text-xs font-medium text-blue-600">
          {currentCredits.toFixed(2)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500">
          {minutesLeft} min available
        </span>
        <span className="text-xs text-gray-500">
          {ratePerMin || 0}/min
        </span>
      </div>
    </div>
  );
};

// Real-time Credit Deduction Display Component
const RealTimeCreditDeductionDisplay = ({ deductionHistory, lastDeduction, lastDeductionTime }) => {
  if (!lastDeductionTime) return null;

  const timeSinceLastDeduction = Date.now() - new Date(lastDeductionTime).getTime();
  const showRecentDeduction = timeSinceLastDeduction < 10000; // Show for 10 seconds

  return (
    <div className="flex items-center gap-2">
      {showRecentDeduction && lastDeduction > 0 && (
        <div className="animate-pulse bg-red-50 border border-red-200 rounded-lg px-2 py-1 flex items-center gap-1">
          <span className="text-xs font-medium text-red-600">
            -{lastDeduction.toFixed(2)}
          </span>
          <CreditCard className="h-3 w-3 text-red-500" />
        </div>
      )}

      {deductionHistory.length > 0 && (
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
          >
            <CreditCard className="h-4 w-4" />
          </Button>
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-10">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Recent Deductions</h4>
              <div className="space-y-2">
                {deductionHistory.slice().reverse().slice(0, 3).map((deduction, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-500">
                        {new Date(deduction.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-red-500 font-medium">
                        -{deduction.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Timer Display Component
const EnhancedTimerDisplay = ({
  countdownSeconds,
  ratePerMin,
  userCredits,
  onEndSession,
  estimatedCreditsUsed
}) => {
  if (!countdownSeconds || countdownSeconds <= 0) return null;

  const creditsPerSecond = ratePerMin ? ratePerMin / 60 : 0;
  const estimatedCreditsLeft = countdownSeconds * creditsPerSecond;

  return (
   <div className="flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-2">
  {/* Timer */}
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-1">
      <Clock className="h-3 w-3 text-green-600" />
      <span className="text-xs text-gray-600">Resterende tijd:</span>
    </div>
    <div className="text-lg font-bold text-green-700 font-mono">
      {formatCountdown(countdownSeconds)}
    </div>
  </div>

  <div className="h-8 w-px bg-green-200"></div>

  {/* Credit Usage */}
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-1">
      <CreditCard className="h-3 w-3 text-blue-600" />
      <span className="text-xs text-gray-600">Gebruikte credits:</span>
    </div>
    <div className="text-lg font-bold text-blue-700">
      {estimatedCreditsUsed.toFixed(2)}
    </div>
    <div className="text-xs text-gray-500">
      {ratePerMin?.toFixed(2)}/min
    </div>
  </div>

  <div className="h-8 w-px bg-green-200"></div>

  {/* Current Credits */}
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-1">
      <Zap className="h-3 w-3 text-yellow-600" />
      <span className="text-xs text-gray-600">Resterende credits:</span>
    </div>
    <div className="text-lg font-bold text-yellow-700">
      {userCredits.toFixed(2)}
    </div>
    <div className="text-xs text-gray-500">
      ~{estimatedCreditsLeft.toFixed(2)} over
    </div>
  </div>

  <div className="h-8 w-px bg-green-200"></div>

  {/* End Session Button */}
  <Button
    onClick={onEndSession}
    variant="outline"
    className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
  >
    Sessie beëindigen
  </Button>
</div>

  );
};

// Live Credit Info Component
const LiveCreditInfo = ({ ratePerMin, userCredits, countdownSeconds }) => {
  if (!ratePerMin || ratePerMin <= 0) return null;

  const creditsPerSecond = ratePerMin / 60;
  const estimatedCreditsLeft = countdownSeconds * creditsPerSecond;

  return (
    <div className="flex items-center justify-center mt-2">
      <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap justify-center">
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          <span className="font-medium">{ratePerMin.toFixed(2)} credits/min</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-yellow-500" />
          <span>Live: {userCredits.toFixed(2)} credits</span>
        </span>
        <span>•</span>
        <span>{Math.floor(userCredits / ratePerMin)} min left</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatCountdown(countdownSeconds)}
        </span>
        <span>•</span>
        <span className="text-blue-600 font-medium">
          ~{estimatedCreditsLeft.toFixed(2)} credits remaining
        </span>
      </div>
    </div>
  );
};

// Accept Session Modal Component with Ringtone
const AcceptSessionModal = ({
  selectedPsychic,
  ratePerMin,
  userCredits,
  pendingAcceptedRequest,
  showAcceptModal,
  setShowAcceptModal,
  handleAcceptSession,
  handleDeclineAccepted,
  ringtoneRef
}) => {
  const [isRinging, setIsRinging] = useState(false);
  const ringIntervalRef = useRef(null);

  // Start ringing when modal opens
  useEffect(() => {
    if (showAcceptModal) {
      startRinging();
    }

    return () => {
      stopRinging();
    };
  }, [showAcceptModal]);

  const startRinging = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio('/new_chat_request.mp3');
      ringtoneRef.current.loop = false;
    }

    setIsRinging(true);

    // Create a loop for continuous ringing
    ringIntervalRef.current = setInterval(() => {
      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current.play().catch(err => {
          console.log('Ringtone play error:', err);
        });
      }
    }, 2000); // Play every 2 seconds (ringtone is 1.5 seconds)
  };

  const stopRinging = () => {
    setIsRinging(false);
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const handleAccept = () => {
    stopRinging();
    handleAcceptSession(pendingAcceptedRequest._id);
    setShowAcceptModal(false);
  };

  const handleDecline = () => {
    stopRinging();
    handleDeclineAccepted(pendingAcceptedRequest._id);
    setShowAcceptModal(false);
  };

  const handleClose = () => {
    stopRinging();
    setShowAcceptModal(false);
  };

  return (
    <Dialog open={showAcceptModal} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRinging && (
              <div className="animate-pulse">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
            )}
            Start Paid Session?
            {isRinging && (
              <span className="text-sm font-normal text-green-600 animate-pulse ml-2">
                Ringing...
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedPsychic?.image} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {selectedPsychic?.name?.[0] || "P"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-800">
                {selectedPsychic.name} heeft je chatverzoek geaccepteerd.
              </span>
            </div>
            <p className="mt-2">
Wil je nu de betaalde sessie starten?            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Session Cost Info */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Sessiekosten</span>
            </div>
            <div className="text-lg font-bold text-green-700">
              {ratePerMin} credits/min
            </div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Je credits: {Number(userCredits).toFixed(2)}
            </div>
            {userCredits > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                Available time: {Math.floor(userCredits / ratePerMin)} minutes
              </div>
            )}
          </div>

          {/* Ringtone Status */}
          {isRinging && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  Ringing... Please respond
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleAccept}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>Accepteren en sessie starten</span>
                {userCredits > 0 && (
                  <span className="ml-2 bg-white text-green-700 text-xs font-medium px-2 py-1 rounded">
                    {Math.floor(userCredits / ratePerMin)}m
                  </span>
                )}
              </div>
            </Button>

            <Button
              onClick={handleDecline}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 py-6"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>Sessie weigeren</span>
              </div>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 text-center mt-2">
            <p>Als je niet reageert, vervalt het verzoek na 1 minuut.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Function to check if input contains only emoji
const containsOnlyEmoji = (str) => {
  // Remove whitespace and check if string contains only emoji
  const trimmedStr = str.trim();
  if (trimmedStr.length === 0) return false;

  // Emoji regex pattern (covers most emojis)
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)+$/u;
  return emojiRegex.test(trimmedStr);
};

export default function ChatInterface() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ========== STATE VARIABLES ==========
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

  // ========== CHAT REQUEST STATE ==========
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
  const [showPicker, setShowPicker] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [endedSessionData, setEndedSessionData] = useState(null);
  const [hasRatedThisSession, setHasRatedThisSession] = useState(false);
const [statusSocket, setStatusSocket] = useState(null);
const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ========== REAL-TIME CREDIT DEDUCTION STATE ==========
  const [realTimeCreditDeduction, setRealTimeCreditDeduction] = useState({
    lastDeduction: 0,
    lastDeductionTime: null,
    remainingCredits: 0,
    deductionHistory: []
  });

  const handleEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji.native + " "); // Add selected emoji
    setShowPicker(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // ========== CALCULATED VALUES ==========
  const selectedPsychic = selectedSession?.psychic || null;
  const ratePerMin = selectedPsychic?.ratePerMin || 0;
  const allowedMinutes = ratePerMin > 0 ? Math.floor(userCredits / ratePerMin) : 0;
  const requiredForOneMinute = ratePerMin || 0;
  const missingAmount = Math.max(0, requiredForOneMinute - userCredits);
  const estimatedCreditsUsed = activeSession?.paidSession?.startTime && ratePerMin > 0
    ? ((Date.now() - new Date(activeSession.paidSession.startTime).getTime()) / 60000) * ratePerMin
    : 0;

  // ========== REFS ==========
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const ringtoneRef = useRef(null); // Separate ref for ringtone
  const selectedSessionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const creditSimulationRef = useRef(null);
  const isMountedRef = useRef(true);
const [psychicStatuses, setPsychicStatuses] = useState({});
const [lastStatusUpdate, setLastStatusUpdate] = useState(Date.now());

  // ========== AXIOS INSTANCE ==========
  const chatApi = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5000',
    timeout: 10000,
  });

  chatApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ========== COMPONENT LIFECYCLE ==========
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearLocalTimer();
      clearCreditSimulation();
      // Clean up ringtones
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, []);

  const fetchAndUpdatePsychicStatuses = useCallback(async (force = false) => {
  // Skip if recent update (unless forced)
  if (!force && Date.now() - lastStatusUpdate < 1000) {
    console.log('⏱️ Skipping status update (too recent)');
    return;
  }

  const psychicIds = chatSessions
    .map(s => s.psychic?._id)
    .filter(id => id);
  
  if (psychicIds.length === 0) return;

  try {
    console.log('⚡ Fetching psychic statuses...');
    
    // Use Promise.race for timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 800)
    );

    const fetchPromise = fetchPsychicStatusesFast(psychicIds);
    
    const statusMap = await Promise.race([fetchPromise, timeoutPromise]);
    
    setPsychicStatuses(prev => ({ ...prev, ...statusMap }));
    setLastStatusUpdate(Date.now());
    
    console.log(`✅ Updated ${Object.keys(statusMap).length} psychic statuses`);
  } catch (error) {
    console.warn('Fast status fetch failed, using fallback:', error);
    
    // Fallback: Use existing socket statuses or mark as unknown
    if (Object.keys(psychicStatuses).length === 0) {
      // Initialize with default status
      const defaultStatusMap = {};
      psychicIds.forEach(id => {
        defaultStatusMap[id] = 'offline';
      });
      setPsychicStatuses(defaultStatusMap);
    }
  }
}, [chatSessions, lastStatusUpdate]);

// Replace your existing useEffect for chat sessions
useEffect(() => {
  if (chatSessions.length > 0) {
    // Fetch immediately on load
    fetchAndUpdatePsychicStatuses(true);
    
    // Set up interval for updates
    const intervalId = setInterval(() => {
      fetchAndUpdatePsychicStatuses();
    }, 10000); // Update every 10 seconds instead of 30
    
    return () => clearInterval(intervalId);
  }
}, [chatSessions.length]);
// ========== ENHANCED SOCKET CONNECTION ==========
useEffect(() => {
  if (!user || !user._id) return;

  const token = localStorage.getItem("accessToken");
  
  // STEP 1: Fetch initial statuses IMMEDIATELY
  if (chatSessions.length > 0) {
    fetchAndUpdatePsychicStatuses(true);
  }

  // STEP 2: Set up socket with better reconnection
  const newStatusSocket = io(`${import.meta.env.VITE_BASE_URL}/status`, { // Separate namespace
    auth: { token, userId: user._id, role: 'user' },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 1000,
    timeout: 10000,
  });

  setStatusSocket(newStatusSocket);

  newStatusSocket.on('connect', () => {
    console.log('✅ Status socket connected');
    
    // Fetch fresh statuses on connect
    fetchAndUpdatePsychicStatuses(true);
    
    // Subscribe to psychic updates
    const psychicIds = chatSessions
      .map(s => s.psychic?._id)
      .filter(id => id);
    
    if (psychicIds.length > 0) {
      newStatusSocket.emit('subscribe_psychic_status', { 
        psychicIds,
        timestamp: Date.now()
      });
    }
  });

  // More aggressive status updates
  newStatusSocket.on('psychic_status_change', (data) => {
    console.log('🔄 Real-time status change:', data);
    
    // Update IMMEDIATELY
    setPsychicStatuses(prev => ({
      ...prev,
      [data.psychicId]: data.status
    }));
    
    // Also update last message time for better UX
    setChatSessions(prev => prev.map(session => {
      if (session.psychic?._id === data.psychicId) {
        return {
          ...session,
          lastStatusUpdate: new Date().toISOString()
        };
      }
      return session;
    }));
  });

  // Bulk status update
  newStatusSocket.on('psychic_status_batch', (data) => {
    console.log('📦 Batch status update:', data.statuses?.length || 0);
    if (data.statuses) {
      const newStatuses = {};
      data.statuses.forEach(status => {
        newStatuses[status.psychicId] = status.status;
      });
      setPsychicStatuses(prev => ({ ...prev, ...newStatuses }));
    }
  });

  // Request status sync when needed
  newStatusSocket.on('status_sync_request', () => {
    console.log('🔄 Status sync requested');
    fetchAndUpdatePsychicStatuses(true);
  });

  // Heartbeat to keep connection alive
  newStatusSocket.on('heartbeat', () => {
    newStatusSocket.emit('heartbeat_ack', { timestamp: Date.now() });
  });

  // Cleanup
  return () => {
    if (newStatusSocket) {
      newStatusSocket.disconnect();
    }
  };
}, [user]);
  useEffect(() => {
    const handleSessionEnded = (data) => {
      console.log('🏁 Session ended, showing rating modal:', data);

      // Check if this session just ended
      if (activeSession?._id === data.requestId && selectedPsychic) {
        // Store session data for rating modal
        setEndedSessionData({
          psychic: selectedPsychic,
          sessionId: data.requestId,
          duration: formatCountdown(countdownSeconds),
          endedAt: new Date()
        });

        // Check if user has already rated this session
        checkIfAlreadyRated(data.requestId, selectedPsychic._id);

        // Show rating modal after a short delay
        setTimeout(() => {
          setShowRatingModal(true);
        }, 1500); // 1.5 second delay
      }
    };

    // Listen for session ended from socket
    if (socketRef.current) {
      socketRef.current.on('session_ended', handleSessionEnded);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('session_ended', handleSessionEnded);
      }
    };
  }, [activeSession, selectedPsychic, countdownSeconds]);

  const checkIfAlreadyRated = async (sessionId, psychicId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/ratings/check-rating`,
        {
          params: { psychicId, sessionId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setHasRatedThisSession(response.data.hasRated);
      }
    } catch (error) {
      console.error('Error checking rating:', error);
    }
  };

  // Update ref when selectedSession changes
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

    // Add throttle to prevent excessive re-renders
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [selectedSession]);

  // ========== AUTH CHECK ==========
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  // ========== AUDIO INITIALIZATION ==========
  useEffect(() => {
    audioRef.current = new Audio('/message_ring.mp3');

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ========== WALLET FUNCTIONS ==========
  const fetchUserWallet = useCallback(async () => {
    if (!user) return;
    try {
      const response = await chatApi.get('/api/chatrequest/wallet/balance');
      if (response.data.success) {
        const wallet = response.data.wallet;
        const newCredits = wallet?.credits || 0;

        setUserBalance(wallet?.balance || 0);
        setUserCredits(newCredits);

        // Update real-time deduction tracking with new credits
        setRealTimeCreditDeduction(prev => ({
          ...prev,
          remainingCredits: newCredits
        }));

        console.log('💰 Wallet fetched:', {
          balance: wallet?.balance,
          credits: newCredits,
          lock: wallet?.lock
        });
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  }, [user]);

  // ========== TIMER FUNCTIONS ==========
  const startLocalTimer = (initialSeconds) => {
    clearLocalTimer();

    if (initialSeconds <= 0) return;

    setCountdownSeconds(initialSeconds);

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

  const clearLocalTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // ========== CREDIT SIMULATION FUNCTIONS ==========
  const startCreditSimulation = () => {
    clearCreditSimulation();

    if (!ratePerMin || ratePerMin <= 0) return;

    const creditsPerSecond = ratePerMin / 60;
    let lastUpdate = Date.now();

    creditSimulationRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - lastUpdate) / 1000;

      if (elapsedSeconds >= 1) {
        const deductionAmount = creditsPerSecond * elapsedSeconds;
        const newCredits = Math.max(0, userCredits - deductionAmount);

        setUserCredits(newCredits);

        // Update real-time deduction tracking
        setRealTimeCreditDeduction(prev => ({
          ...prev,
          lastDeduction: deductionAmount,
          lastDeductionTime: new Date(),
          remainingCredits: newCredits,
          deductionHistory: [
            ...prev.deductionHistory.slice(-4),
            {
              amount: deductionAmount,
              time: new Date(),
              remaining: newCredits
            }
          ]
        }));

        lastUpdate = now;
      }
    }, 100); // Update every 100ms for smooth animation
  };

  const clearCreditSimulation = () => {
    if (creditSimulationRef.current) {
      clearInterval(creditSimulationRef.current);
      creditSimulationRef.current = null;
    }
  };

  // Start/stop credit simulation based on active session
  useEffect(() => {
    if (activeSession && activeSession.status === 'active' && countdownSeconds > 0 && ratePerMin > 0) {
      startCreditSimulation();
    } else {
      clearCreditSimulation();
    }

    return () => clearCreditSimulation();
  }, [activeSession, countdownSeconds, ratePerMin]);

  // Reset deduction tracking when session starts
  useEffect(() => {
    if (activeSession && activeSession.status === 'active') {
      setRealTimeCreditDeduction({
        lastDeduction: 0,
        lastDeductionTime: null,
        remainingCredits: userCredits,
        deductionHistory: []
      });
    }
  }, [activeSession]);

  // ========== CHAT REQUEST FUNCTIONS ==========
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

          // CRITICAL FIX: Always set countdown from session data
          if (session.paidSession?.remainingSeconds) {
            console.log('⏰ Setting countdown from active session:', session.paidSession.remainingSeconds);
            setCountdownSeconds(session.paidSession.remainingSeconds);
            startLocalTimer(session.paidSession.remainingSeconds);
          } else {
            console.log('⚠️ No remainingSeconds in paidSession, checking other fields');
            // Try to get remaining seconds from other fields
            const remainingSecs = session.remainingSeconds ||
                                 (session.totalMinutes * 60) ||
                                 Math.floor((session.remainingBalance || 0) / ratePerMin) * 60;
            if (remainingSecs > 0) {
              console.log('⏰ Setting countdown from calculated value:', remainingSecs);
              setCountdownSeconds(remainingSecs);
              startLocalTimer(remainingSecs);
            }
          }
        } else if (session.status === 'accepted') {
          setPendingAcceptedRequest(session);
        }

        // Update chat sessions list
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
  }, [user, selectedSession, ratePerMin]);


const fetchPsychicStatusesFast = async (psychicIds) => {
  if (!psychicIds || psychicIds.length === 0) return {};
  
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/human-psychics/statuses-fast`,
      { psychicIds },
      { 
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 1000 // Fast timeout
      }
    );

    if (response.data.success) {
      const statusMap = {};
      Object.keys(response.data.statuses).forEach(id => {
        statusMap[id] = response.data.statuses[id].status;
      });
      return statusMap;
    }
    return {};
  } catch (error) {
    console.warn('Fast status API failed:', error);
    return {};
  }
};

const fetchAllPsychicStatusesFast = async () => {
  const psychicIds = chatSessions
    .map(s => s.psychic?._id)
    .filter(id => id);
  
  if (psychicIds.length === 0) return;

  const statusMap = await fetchPsychicStatusesFast(psychicIds);
  setPsychicStatuses(prev => ({ ...prev, ...statusMap }));
  console.log(`⚡ Instantly loaded ${Object.keys(statusMap).length} psychic statuses`);
};
// Add this state for storing statuses


  
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

  const handleRequestSent = async (requestData) => {
    console.log('Chat request sent:', requestData);
    setPendingSession(requestData);
    await fetchUserWallet();
    await checkPendingRequest();
    toast.success("Chat request sent successfully!");
  };

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
        clearCreditSimulation();
        await fetchUserWallet();
        toast.success("Session ended successfully");
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error("Failed to end session");
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await fetchUserWallet();
    setIsRefreshing(false);
    toast.success("Balance refreshed successfully");
  };

  // ========== SOCKET.IO SETUP ==========
  useEffect(() => {
    if (!user || !isMountedRef.current) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("No authentication token found");
      return;
    }

    // Initialize socket
    socketRef.current = io(import.meta.env.VITE_BASE_URL || 'http://localhost:5000', {
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

    // ========== SOCKET EVENT HANDLERS ==========

    // Connection established
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

      // If we have an active session, join its room
      if (activeSession?._id) {
        socketRef.current.emit('join_chat_request', { chatRequestId: activeSession._id });
      }
    });

    // NEW MESSAGE HANDLER
    socketRef.current.on('new_message', (data) => {
      console.log('📩📩📩 NEW MESSAGE RECEIVED VIA SOCKET:', data);
      const { message, chatSessionId, senderId, senderRole } = data;

      // Only handle messages from psychic (ignore own messages)
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
          // Check if message already exists (prevent duplicates)
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
        const psychicName = chatSessions.find(s => s._id === chatSessionId)?.psychic?.name || 'Psychic';
        toast.info(`New message from ${psychicName}`);
      }
    });

    // Typing indicator
    socketRef.current.on('typing_indicator', ({ chatSessionId, isTyping }) => {
      if (chatSessionId === selectedSessionRef.current?._id) {
        setIsTyping(isTyping);
      }
    });

    // ========== CHAT REQUEST EVENTS ==========

    // Chat request accepted
    socketRef.current.on('chat_request_accepted', (data) => {
      console.log('✅ Chat request accepted received:', data);
      if (pendingSession?._id === data.chatRequest._id) {
        setPendingSession(null);
        setPendingAcceptedRequest(data.chatRequest);
        setShowAcceptModal(true);
      }

      // Update chat sessions list
      setChatSessions(prev => prev.map(session =>
        session.psychic?._id === data.psychicId
          ? { ...session, chatRequest: data.chatRequest }
          : session
      ));

      toast.success(`🎉 ${data.psychicName} accepted your chat request!`, {
        duration: 5000,
        action: {
          label: 'Start Session',
          onClick: () => {
            setShowAcceptModal(true);
          }
        }
      });
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
      console.log('⏰ Timer tick:', data);

      if (activeSession?._id === data.requestId) {
        setCountdownSeconds(data.remainingSeconds);

        // Update credits if provided
        if (data.currentBalance !== undefined) {
          setUserCredits(data.currentBalance);
        }
      }
    });

    // Credit deduction updates
    socketRef.current.on('credit_deduction', (data) => {
      console.log('💰 Credit deduction received:', data);

      if (activeSession?._id === data.requestId) {
        setUserCredits(data.newBalance);

        // Update real-time deduction tracking
        setRealTimeCreditDeduction(prev => ({
          ...prev,
          lastDeduction: data.deductedAmount,
          lastDeductionTime: new Date(),
          remainingCredits: data.newBalance,
          deductionHistory: [
            ...prev.deductionHistory.slice(-4),
            {
              amount: data.deductedAmount,
              time: new Date(),
              remaining: data.newBalance
            }
          ]
        }));

        // Show notification for deduction
        if (data.deductedAmount > 0) {
          toast.info(`-${data.deductedAmount.toFixed(2)} credits deducted`, {
            duration: 2000,
            icon: <CreditCard className="h-4 w-4" />
          });
        }
      }
    });

    // Listen for session started
    socketRef.current.on('session_started', (data) => {
      console.log('🚀 Session started via socket:', data);

      // Get the psychic ID from the data
      const psychicId = data.psychicId || data.chatRequest?.psychic?._id;

      if (selectedPsychic?._id === psychicId) {
        console.log('✅ Matching psychic, updating UI');

        // Clear all pending states
        setPendingSession(null);
        setPendingAcceptedRequest(null);
        setShowAcceptModal(false);

        // Set active session
        setActiveSession(data.chatRequest);

        // Get remaining seconds
        const remainingSecs = data.remainingSeconds ||
                             data.chatRequest?.paidSession?.remainingSeconds ||
                             (data.chatRequest?.totalMinutes * 60) || 0;

        console.log('⏰ Socket remaining seconds:', remainingSecs);

        if (remainingSecs > 0) {
          setCountdownSeconds(remainingSecs);
          startLocalTimer(remainingSecs);
        }

        // Update chat sessions
        setChatSessions(prev => prev.map(session =>
          session.psychic?._id === psychicId
            ? {
                ...session,
                chatRequest: data.chatRequest,
                lastMessage: 'Paid session started',
                lastMessageAt: new Date()
              }
            : session
        ));

        toast.success("✅ Paid session started! Timer is running.", {
          duration: 3000
        });
      }
    });

    // Listen for session ended
    socketRef.current.on('session_ended', (data) => {
      console.log('🏁 Session ended:', data);

      if (activeSession?._id === data.requestId) {
        setActiveSession(null);
        setCountdownSeconds(0);
        clearLocalTimer();
        clearCreditSimulation();
        fetchUserWallet();

        toast.success("Session ended successfully", {
          duration: 3000
        });
      }
    });

    // Connect error
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error("Connection error. Trying to reconnect...");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearLocalTimer();
      clearCreditSimulation();
    };
  }, [user, chatSessions, activeSession, pendingSession, ratePerMin]);

  // Add to your frontend useEffect
  useEffect(() => {
    const syncMessages = async () => {
      if (!selectedSession?._id || !socketRef.current?.connected) return;

      try {
        console.log('🔄 Checking for missed messages...');

        const lastMessage = messages[selectedSession._id]?.[messages[selectedSession._id]?.length - 1];
        const lastMessageId = lastMessage?._id;

        socketRef.current.timeout(5000).emit('sync_messages', {
          chatSessionId: selectedSession._id,
          lastMessageId
        }, (err, response) => {
          if (err) {
            console.error('Sync error:', err);
            return;
          }

          if (response.success && response.messages?.length > 0) {
            console.log(`📥 Synced ${response.messages.length} missed messages`);

            setMessages(prev => {
              const currentMsgs = prev[selectedSession._id] || [];
              const newMessages = response.messages.filter(newMsg =>
                !currentMsgs.some(existingMsg => existingMsg._id === newMsg._id)
              );

              if (newMessages.length > 0) {
                console.log(`✅ Adding ${newMessages.length} synced messages`);
                return {
                  ...prev,
                  [selectedSession._id]: [...currentMsgs, ...newMessages]
                };
              }
              return prev;
            });
          }
        });
      } catch (error) {
        console.error('Sync failed:', error);
      }
    };

    // Sync every 30 seconds
    const syncInterval = setInterval(syncMessages, 30000);

    // Also sync when socket reconnects
    const handleReconnect = () => {
      setTimeout(syncMessages, 2000);
    };

    if (socketRef.current) {
      socketRef.current.on('reconnect', handleReconnect);
    }

    return () => {
      clearInterval(syncInterval);
      if (socketRef.current) {
        socketRef.current.off('reconnect', handleReconnect);
      }
    };
  }, [selectedSession, messages]);

  // ========== CHAT SESSION FUNCTIONS ==========
  // Update your fetchChats function (around line 593):
const fetchChats = useCallback(async () => {
  if (!user || !user._id) return;
  setLoading(true);
  setError(null);
  try {
    const { data } = await chatApi.get('/api/humanchat/sessions');

    console.log("User chats response:", data);

    if (data.success) {
      const sessions = data.chatSessions || [];
      setChatSessions(sessions);

      // ========== FETCH PSYCHIC STATUSES IMMEDIATELY ==========
      const psychicIds = sessions
        .map(s => s.psychic?._id)
        .filter(id => id);
      
      if (psychicIds.length > 0) {
        const statusMap = await fetchPsychicStatusesFast(psychicIds);
        setPsychicStatuses(statusMap);
        console.log(`⚡ Loaded ${Object.keys(statusMap).length} psychic statuses`);
      }

      // Fetch wallet balance
      await fetchUserWallet();

      // If we have a selected session, check for pending/active requests
      if (selectedSession) {
        await checkActiveChatRequest();
        await checkPendingRequest();
      }
    } else {
      throw new Error(data.message || "Failed to load chats");
    }
  } catch (err) {
    console.error("Fetch user chats error:", err);
    const errorMsg = err.response?.data?.message || err.message || "Failed to load chats";
    setError(errorMsg);
    toast.error(errorMsg);
  } finally {
    setLoading(false);
  }
}, [user, selectedSession, fetchUserWallet, checkActiveChatRequest, checkPendingRequest]);


// ========== REAL-TIME PSYCHIC STATUS UPDATES ==========
useEffect(() => {
  if (!user || !user._id) return;

  const token = localStorage.getItem("accessToken");
  
  // STEP 1: Fetch initial statuses via FAST API (INSTANT)
  if (chatSessions.length > 0) {
    fetchAllPsychicStatusesFast();
  }

  // STEP 2: Set up socket for real-time updates
  const newStatusSocket = io(`${import.meta.env.VITE_BASE_URL}`, {
    auth: {
      token,
      userId: user._id,
      role: 'user'
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  setStatusSocket(newStatusSocket);

  newStatusSocket.on('connect', () => {
    console.log('✅ Status socket connected for real-time updates');
    
    // Get all psychic IDs from chat sessions
    const psychicIds = chatSessions
      .map(s => s.psychic?._id)
      .filter(id => id);
    
    if (psychicIds.length > 0) {
      // Subscribe to real-time status updates
      newStatusSocket.emit('subscribe_to_psychic_status', { psychicIds });
      
      // Also join global room
      newStatusSocket.emit('join_room', 'psychic_list_status');
    }
  });

  // Listen for real-time status updates
  newStatusSocket.on('psychic_status_changed', (data) => {
    console.log('🔄 Real-time psychic status changed:', data);
    setPsychicStatuses(prev => ({
      ...prev,
      [data.psychicId]: data.status
    }));
  });

  newStatusSocket.on('psychic_status_update', (data) => {
    console.log('📡 Global psychic status update:', data);
    setPsychicStatuses(prev => ({
      ...prev,
      [data.psychicId]: data.status
    }));
  });

  newStatusSocket.on('psychic_online', (data) => {
    console.log('💚 Psychic came online:', data.psychicId);
    setPsychicStatuses(prev => ({
      ...prev,
      [data.psychicId]: 'online'
    }));
  });

  newStatusSocket.on('psychic_statuses_response', (data) => {
    console.log('📋 Initial psychic statuses from socket');
    if (data.statuses) {
      const newStatuses = {};
      Object.keys(data.statuses).forEach(psychicId => {
        newStatuses[psychicId] = data.statuses[psychicId].status;
      });
      setPsychicStatuses(prev => ({ ...prev, ...newStatuses }));
    }
  });

  newStatusSocket.on('connect_error', (error) => {
    console.error('Status socket connection error:', error);
  });

  // Cleanup
  return () => {
    if (newStatusSocket) {
      newStatusSocket.disconnect();
    }
  };
}, [user]); // Only depend on user, not chatSessions


// When chat sessions load or change, update status subscriptions
useEffect(() => {
  if (chatSessions.length > 0 && statusSocket?.connected) {
    const psychicIds = chatSessions
      .map(s => s.psychic?._id)
      .filter(id => id);
    
    if (psychicIds.length > 0) {
      // Subscribe to new psychics
      statusSocket.emit('subscribe_to_psychic_status', { psychicIds });
      
      // Also fetch via fast API for immediate update
      fetchAllPsychicStatusesFast();
    }
  }
}, [chatSessions.length]); // Run when number of chat sessions changes

// Add periodic status refresh (every 30 seconds)
useEffect(() => {
  if (chatSessions.length === 0) return;
  
  const intervalId = setInterval(() => {
    fetchAllPsychicStatusesFast();
  }, 30000);
  
  return () => clearInterval(intervalId);
}, [chatSessions.length]);
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

  // ========== MESSAGE FUNCTIONS ==========
  const fetchMessages = useCallback(async (sessionId) => {
    if (!sessionId || !user) return;
    try {
      const { data } = await chatApi.get(`/api/humanchat/messages/${sessionId}`);

      console.log("User messages response:", data);

      if (data.success) {
        setMessages(prev => ({
          ...prev,
          [sessionId]: data.messages || []
        }));

        // Mark messages as read
        await chatApi.put(`/api/humanchat/messages/${sessionId}/read`);

        // Reset unread count
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

  // Auto scroll to bottom when messages change
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

  // ========== SEND MESSAGE FUNCTION ==========
  const handleSend = async () => {
    const messageContent = input.trim();
    if (!messageContent || !selectedSession || !user) {
      return;
    }

    // Check if we have an active paid session with time left
    if (activeSession && activeSession.status === 'active' && countdownSeconds <= 0) {
      toast.error("Session time has expired. Please add more credits to continue.");
      return;
    }

    // Check if we have credits for paid session
    if (activeSession && activeSession.status === 'active' && userCredits < (ratePerMin / 60)) {
      toast.error("Insufficient credits to send message. Please add more credits.");
      return;
    }

    try {
      const { data } = await chatApi.post('/api/humanchat/messages', {
        chatSessionId: selectedSession._id,
        content: messageContent,
        messageType: "text",
      });

      console.log("✅ User send message response:", data);

      if (data.success && data.message) {
        const newMessage = data.message;

        // Add message to state IMMEDIATELY
        setMessages(prev => ({
          ...prev,
          [selectedSession._id]: [...(prev[selectedSession._id] || []), newMessage],
        }));

        // Update session
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
        if (socketRef.current?.connected) {
          socketRef.current.emit("typing", {
            chatSessionId: selectedSession._id,
            isTyping: false
          });

          // EMIT MESSAGE VIA SOCKET
          socketRef.current.emit("send_message", {
            chatSessionId: selectedSession._id,
            message: newMessage,
            senderId: user._id,
            senderRole: 'user'
          });
        }

        // Focus input after sending
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err) {
      console.error("❌ Failed to send message", err);
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  };

  // ========== INPUT HANDLERS ==========
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (selectedSession && socketRef.current?.connected) {
      socketRef.current.emit("typing", {
        chatSessionId: selectedSession._id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ========== SESSION HANDLERS ==========
  const handleAcceptSession = async (requestId) => {
    try {
      console.log('🚀 Starting session for request:', requestId);

      const response = await chatApi.post('/api/chatrequest/start-session', { requestId });

      if (response.data.success) {
        const sessionData = response.data.data;
        console.log('✅ Session started API response:', sessionData);

        // IMMEDIATE STATE UPDATES - Clear all pending states first
        setPendingSession(null);
        setPendingAcceptedRequest(null);
        setShowAcceptModal(false);

        // Set active session IMMEDIATELY
        setActiveSession(sessionData);

        // CRITICAL: Get remaining seconds from multiple possible locations
        let remainingSecs = 0;

        // Check in order of priority
        if (sessionData.paidSession?.remainingSeconds) {
          remainingSecs = sessionData.paidSession.remainingSeconds;
          console.log('⏰ Found in paidSession.remainingSeconds:', remainingSecs);
        } else if (sessionData.remainingSeconds) {
          remainingSecs = sessionData.remainingSeconds;
          console.log('⏰ Found in remainingSeconds:', remainingSecs);
        } else if (sessionData.totalMinutes) {
          remainingSecs = sessionData.totalMinutes * 60;
          console.log('⏰ Calculated from totalMinutes:', remainingSecs);
        } else if (sessionData.remainingBalance && ratePerMin) {
          remainingSecs = Math.floor(sessionData.remainingBalance / ratePerMin) * 60;
          console.log('⏰ Calculated from remainingBalance:', remainingSecs);
        }

        console.log('⏰ Final remaining seconds:', remainingSecs);

        // Set countdown IMMEDIATELY
        if (remainingSecs > 0) {
          setCountdownSeconds(remainingSecs);
          startLocalTimer(remainingSecs);
        }

        // Update chat sessions IMMEDIATELY
        setChatSessions(prev => prev.map(session =>
          session.psychic?._id === selectedPsychic?._id
            ? {
                ...session,
                chatRequest: sessionData,
                lastMessage: 'Paid session started',
                lastMessageAt: new Date()
              }
            : session
        ));

        // Fetch updated wallet
        await fetchUserWallet();

        toast.success("✅ Session started! Timer is running.", {
          duration: 3000
        });

        // Emit socket event for real-time updates
        if (socketRef.current?.connected) {
          socketRef.current.emit('session_started', {
            requestId: requestId,
            chatRequest: sessionData,
            psychicId: selectedPsychic?._id,
            remainingSeconds: remainingSecs
          });
        }

        // Force a re-render check
        setTimeout(() => {
          console.log('🔄 Checking session state after start');
          checkActiveChatRequest();
        }, 500);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error(error.response?.data?.message || 'Failed to start session');
    }
  };

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
        // Store session data before clearing
        const sessionToRate = {
          psychic: selectedPsychic,
          sessionId: activeSession._id,
          duration: formatCountdown(countdownSeconds),
          endedAt: new Date()
        };

        // Clear session states
        setActiveSession(null);
        setCountdownSeconds(0);
        clearLocalTimer();
        clearCreditSimulation();
        await fetchUserWallet();

        // Store for rating modal
        setEndedSessionData(sessionToRate);

        // Check if already rated
        checkIfAlreadyRated(activeSession._id, selectedPsychic._id);

        // Show rating modal after a short delay
        setTimeout(() => {
          setShowRatingModal(true);
        }, 1000);

        toast.success("Session ended successfully");
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error("Failed to end session");
    }
  };

  const handleRatingSubmitted = (ratingData) => {
    console.log('Rating submitted:', ratingData);
    setHasRatedThisSession(true);
    toast.success("Thank you for your feedback!");

    // Update psychic's rating in the chat list
    if (selectedPsychic) {
      setChatSessions(prev => prev.map(session =>
        session.psychic?._id === selectedPsychic._id
          ? {
              ...session,
              psychic: {
                ...session.psychic,
                rating: ratingData.averageRating || session.psychic.rating,
                totalRatings: ratingData.totalRatings || session.psychic.totalRatings
              }
            }
          : session
      ));
    }
  };

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

  // ========== UI HELPERS ==========
  const filteredSessions = chatSessions.filter((session) => {
    const psychicName = session.psychic?.name?.toLowerCase() || '';
    const psychicBio = session.psychic?.bio?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return psychicName.includes(query) || psychicBio.includes(query);
  });

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    if (isMobileView) {
      setShowChatList(false);
    }
  };

  const handleBackToChatList = () => {
    if (isMobileView) {
      setShowChatList(true);
      setSelectedSession(null);
    }
  };

  // ========== RENDER STATES ==========
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

  if (error && chatSessions.length === 0) {
    return (
      <div className="h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 mb-4">
            <Sparkles className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Chats</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#00a884] hover:bg-[#128c7e]"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const currentMessages = messages[selectedSession?._id] || [];

  // ========== MAIN RENDER ==========
  return (
    <div className="h-screen bg-[#f0f2f5] overflow-hidden">
      <div className="flex h-full">
        {/* Chat List Sidebar */}
        <div className={cn(
          "flex flex-col w-full md:w-96 bg-white border-r border-[#e9edef] transition-all duration-300 ease-in-out h-full",
          showChatList ? "flex" : "hidden md:flex"
        )}>
          {/* Header */}
          <div className="p-4 bg-[#f0f2f5]">
            {/* Search */}
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
                    {searchQuery ? "No psychics match your search" : "Start chatting with a psychic"}
                  </p>
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
                  const hasActiveRequest = activeSession?.psychic?._id === session.psychic?._id &&
                                          activeSession?.status === 'active';
                  const hasPendingRequest = pendingSession?.psychic?._id === session.psychic?._id &&
                                           pendingSession?.status === 'pending';
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
                        {hasPendingRequest && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center">
                            <Clock className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800 text-sm">
                              {session.psychic?.name || "Psychic"}

                            </h3>

              <div className="flex items-center">
  {psychicStatuses[session.psychic?._id] ? (
    <>
      <div className={`h-2 w-2 rounded-full mr-1 ${
        psychicStatuses[session.psychic?._id] === 'online' 
          ? 'bg-green-500 animate-pulse' 
          : psychicStatuses[session.psychic?._id] === 'away'
          ? 'bg-yellow-500'
          : psychicStatuses[session.psychic?._id] === 'busy'
          ? 'bg-orange-500'
          : 'bg-gray-400'
      }`} />
      <span className="text-xs text-gray-500 capitalize">
        {psychicStatuses[session.psychic?._id]}
      </span>
    </>
  ) : (
    // Show loading while fetching status
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 rounded-full bg-gray-300"></div>
      <span className="text-xs text-gray-400">...</span>
    </div>
  )}
</div>
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              <span className="text-xs text-gray-700">{session.psychic?.rating || 4.8}</span>
                            </div>
                            {hasActiveRequest && (
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                            {hasPendingRequest && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded animate-pulse">
                                Pending
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
                            ) : hasPendingRequest ? (
                              <span className="flex items-center gap-1 text-yellow-600">
                                <Clock className="h-3 w-3" />
                                Waiting for acceptance
                              </span>
                            ) : session.lastMessage?.content || "Chat aanvragen"}
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
              {/* SINGLE UNIFIED HEADER - RESPONSIVE */}
              <div className="bg-white border-b border-[#e9edef]">
                <div className="px-3 md:px-4 py-3">
                  {/* Top Row: Chat Info - Always visible */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      {isMobileView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBackToChatList}
                          className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 text-gray-600 hover:text-gray-900"
                        >
                          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      )}

                      <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                        <AvatarImage src={selectedPsychic?.image} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                          {selectedPsychic?.name?.[0] || "P"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 md:gap-2">
                          <h2 className="font-semibold text-gray-800 text-sm md:text-base truncate">
                            {selectedPsychic?.name || "Psychic"}
                          </h2>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs text-gray-700">{selectedPsychic?.rating || 4.8}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {onlineStatus[selectedPsychic?._id] ? (
                            <span className="text-green-600">Online</span>
                          ) : (
                            `Laatst gezien ${formatTime(selectedSession.lastMessageAt)}`
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Mobile: Show only essential buttons */}
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      {isMobileView ? (
                        // Mobile: Simplified button group
                        <>
                          {activeSession && activeSession.status === 'active' ? (
                            <div className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                              {formatCountdown(countdownSeconds)}
                            </div>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 md:h-10 md:w-10 text-gray-500 hover:text-gray-700"
                          >
                            <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </>
                      ) : (
                        // Desktop: Full button set
                        <>

                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Credits & Actions - Responsive */}
                  <div className={cn(
                    "flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4",
                    isMobileView && "space-y-2"
                  )}>
                    {/* Credits Info - Responsive */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 flex-1 min-w-0">
                      {/* Rate per minute - Always visible */}
                      <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600 flex-shrink-0">
                        <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="font-medium truncate">{ratePerMin} credits/min</span>
                      </div>

                      {/* Progress bar and controls - Responsive */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={cn(
                          "min-w-0",
                          isMobileView ? "w-32" : "w-40 md:w-48"
                        )}>
                          <CreditProgressBar
                            currentCredits={userCredits}
                            ratePerMin={ratePerMin}
                          />
                        </div>

                        {/* Real-time deduction display - Hidden on very small screens */}
                        {!isMobileView && (
                          <RealTimeCreditDeductionDisplay
                            deductionHistory={realTimeCreditDeduction.deductionHistory}
                            lastDeduction={realTimeCreditDeduction.lastDeduction}
                            lastDeductionTime={realTimeCreditDeduction.lastDeductionTime}
                          />
                        )}

                        <Button
                          onClick={handleRefreshBalance}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? (
                            <div className="h-3 w-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="h-3 w-3 text-gray-500 hover:text-gray-700">⟳</div>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons - Responsive */}
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      {/* Active Paid Session Timer - Responsive */}
                      {activeSession && activeSession.status === 'active' ? (
                        <div className={cn(
                          "w-full md:w-auto",
                          isMobileView ? "scale-95" : ""
                        )}>
                          <EnhancedTimerDisplay
                            countdownSeconds={countdownSeconds}
                            ratePerMin={ratePerMin}
                            userCredits={userCredits}
                            estimatedCreditsUsed={estimatedCreditsUsed}
                            onEndSession={handleEndSession}
                          />
                        </div>
                      ) : pendingSession ? (
                        // Pending Request Display - Responsive
                        <div className={cn(
                          "flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg px-2 md:px-3 py-1 md:py-1.5 animate-pulse",
                          isMobileView && "scale-90"
                        )}>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                            <span className="text-xs md:text-sm font-medium text-yellow-700">Pending</span>
                          </div>
                          <Button
                            onClick={handleCancelRequest}
                            size="sm"
                            variant="outline"
                            className="h-6 md:h-7 text-xs border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : pendingAcceptedRequest ? (
                        // Accepted Request - Start Session Button - Responsive
                        <div className={cn(
                          "flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-2 md:px-3 py-1 md:py-1.5",
                          isMobileView && "scale-90"
                        )}>
                          <Button
                            onClick={() => handleAcceptSession(pendingAcceptedRequest._id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
                            size="sm"
                          >
                            <Sparkles className="mr-1 md:mr-2 h-3 w-3" />
                            Start Session
                            {ratePerMin > 0 && userCredits > 0 && (
                              <span className="ml-1 md:ml-2 bg-white text-green-700 text-xs font-medium px-1 py-0.5 rounded">
                                {Math.floor(userCredits / ratePerMin)}m
                              </span>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDeclineAccepted(pendingAcceptedRequest._id)}
                            variant="outline"
                            size="sm"
                            className="h-6 md:h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        // Request Chat Button - Responsive
                        <Button
                          onClick={() => setShowRequestModal(true)}
                          disabled={userCredits < ratePerMin}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs md:text-sm"
                          size="sm"
                        >
                          <Sparkles className="mr-1 md:mr-2 h-3 w-3" />
                          Chat aanvragen
                          {allowedMinutes > 0 && (
                            <span className="ml-1 md:ml-2 bg-white text-purple-700 text-xs font-medium px-1 py-0.5 rounded">
                              {allowedMinutes}m
                            </span>
                          )}
                        </Button>
                      )}

                      {/* Add Credits Button - Responsive */}
                   {/* Add Credits Button - Responsive */}
{!activeSession && !pendingSession && !pendingAcceptedRequest &&
userCredits < ratePerMin && (
  <Button
    onClick={() => setShowPaymentModal(true)}
    variant="outline"
    size="sm"
    className={cn(
      "border-amber-300 text-amber-700 hover:bg-amber-50 text-xs md:text-sm",
      isMobileView && "scale-90"
    )}
  >
    <AlertCircle className="mr-1 md:mr-2 h-3 w-3" />
    Add Credits
  </Button>
)}

                      {/* Add Refresh Timer Button - Hidden on mobile */}
                      {activeSession && !isMobileView && (
                        <Button
                          onClick={async () => {
                            console.log('🔄 Manually refreshing timer');
                            await checkActiveChatRequest();
                            toast.info("Timer refreshed");
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                          title="Refresh timer"
                        >
                          ⟳
                        </Button>
                      )}
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
                          {activeSession ? "Paid Session Active!" :
                          pendingSession ? "Request Pending..." :
                          pendingAcceptedRequest ? "Session Accepted!" :
                          "Start een gesprek"}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          {activeSession
                            ? `You have ${Math.floor(userCredits / ratePerMin)} minutes available. Chat freely!`
                            : pendingSession
                            ? `Waiting for ${selectedPsychic?.name || "the psychic"} to accept your request...`
                            : pendingAcceptedRequest
                            ? `${selectedPsychic?.name || "Psychic"} accepted! Click "Start Session" to begin.`
                            : `Send your first message to ${selectedPsychic?.name || "the psychic"}`
                          }
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Date separator */}
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

              {/* Input Area - REMOVED FILES AND VOICE ICONS */}
              <div className="bg-[#f0f2f5] p-3">
                <div className="flex items-center gap-2 relative">
                  {/* Emoji Picker Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPicker(!showPicker)}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  {showPicker && (
                    <div className="absolute bottom-14 left-0 z-50">
                      <Picker
                        onEmojiSelect={handleEmojiSelect}
                        theme="light"
                      />
                    </div>
                  )}
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder={activeSession ? "Type a message (Paid session active)" : "Type a message"}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="h-12 pl-4 pr-12 bg-white border-none rounded-full focus-visible:ring-0"
                      disabled={!(activeSession && activeSession.status === 'active' && countdownSeconds > 0)}
                    />
                    {!(activeSession && activeSession.status === 'active' && countdownSeconds > 0) && (
                      <div className="absolute inset-0 bg-gray-100/80 rounded-full flex items-center justify-center">
                        <span className="text-sm text-gray-500">
                          {activeSession ? "Add credits to continue chatting" : "Start een betaalde chatsessie"}
                        </span>
                      </div>
                    )}
                  </div>
                  {input.trim() && (
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="h-12 w-12 rounded-full bg-[#00a884] hover:bg-[#128c7e]"
                      disabled={!(activeSession && activeSession.status === 'active' && countdownSeconds > 0)}
                    >
                      <Send className="h-5 w-5 text-white" />
                    </Button>
                  )}
                </div>

                {activeSession && activeSession.status === 'active' && (
                  <LiveCreditInfo
                    ratePerMin={ratePerMin}
                    userCredits={userCredits}
                    countdownSeconds={countdownSeconds}
                  />
                )}
              </div>
            </div>
          ) : (
            // Empty State
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
                      <div className="h-3 w-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="h-3 w-3 text-gray-500 hover:text-gray-700">⟳</div>
                    )}
                  </Button>
                </div>
                {activeSession && activeSession.status === 'active' && (
                  <div className="flex items-center justify-center mt-4">
                    <EnhancedTimerDisplay
                      countdownSeconds={countdownSeconds}
                      ratePerMin={ratePerMin}
                      userCredits={userCredits}
                      estimatedCreditsUsed={estimatedCreditsUsed}
                      onEndSession={handleEndSession}
                    />
                  </div>
                )}
                {chatSessions.length === 0 ? (
                  <Button
                    onClick={() => navigate('/psychics')}
                    className="bg-[#00a884] hover:bg-[#128c7e] text-white mt-6"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Browse Psychics
                  </Button>
                ) : null}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6">
                  <Shield className="h-4 w-4" />
                  <span>End-to-end encrypted</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {endedSessionData && (
        <RatingModal
          isOpen={showRatingModal && !hasRatedThisSession}
          onClose={() => {
            setShowRatingModal(false);
            setEndedSessionData(null);
          }}
          psychic={endedSessionData.psychic}
          sessionId={endedSessionData.sessionId}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}

      {/* Chat Request Modal */}
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
{/* Payment Modal */}
<PaymentModal
  isOpen={showPaymentModal}
  onOpenChange={setShowPaymentModal}
  onPaymentSuccess={fetchUserWallet} // Refresh credits after successful payment
/>
      {/* Accept Session Modal with Ringtone */}
      {selectedPsychic && showAcceptModal && pendingAcceptedRequest && (
        <AcceptSessionModal
          selectedPsychic={selectedPsychic}
          ratePerMin={ratePerMin}
          userCredits={userCredits}
          pendingAcceptedRequest={pendingAcceptedRequest}
          showAcceptModal={showAcceptModal}
          setShowAcceptModal={setShowAcceptModal}
          handleAcceptSession={handleAcceptSession}
          handleDeclineAccepted={handleDeclineAccepted}
          ringtoneRef={ringtoneRef}
        />
      )}
    </div>
  );
}