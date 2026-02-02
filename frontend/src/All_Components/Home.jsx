import { MessageCircle, Star, Lock, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProfileSection1 } from "./Short_COmponents/Profiles";
import { toast } from "sonner";
import { parse, isValid, isBefore, isLeapYear } from "date-fns";
import { useAuth } from "./screen/AuthContext";
import { motion } from "framer-motion";
import { debounce } from "lodash";
import VideoSection from "./VideoSection";
import io from 'socket.io-client';

const Home = () => {
  const { user, loading: authLoading, error: authError, setUser } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const location = useLocation();
  const [psychics, setPsychics] = useState([]);
  const [humanPsychics, setHumanPsychics] = useState([]);
  const [showing, setShowing] = useState(4);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPsychic, setSelectedPsychic] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [numerologyReport, setNumerologyReport] = useState(null);
  const [astrologyReport, setAstrologyReport] = useState(null);
  const [loveCompatibilityReport, setLoveCompatibilityReport] = useState(null);
  const [monthlyForecastReport, setMonthlyForecastReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [modalType, setModalType] = useState(null);
  const [pdfReport, setPdfReport] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [lovePdfReport, setLovePdfReport] = useState(null);
  const [psychicStatuses, setPsychicStatuses] = useState({});
  const [statusLoading, setStatusLoading] = useState(false);
const [socketConnected, setSocketConnected] = useState(false);
const [ratingSummaries, setRatingSummaries] = useState({});

const subscribedPsychicsRef = useRef(new Set());
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    email: "",
    yourFirstName: "",
    yourLastName: "",
    yourBirthDate: "",
    yourBirthTime: "",
    yourBirthPlace: "",
    partnerFirstName: "",
    partnerLastName: "",
    partnerBirthDate: "",
    partnerBirthTime: "",
    partnerPlaceOfBirth: "",
  });
  const [emailError, setEmailError] = useState("");
  const [isLoadingPsychics, setIsLoadingPsychics] = useState(false);
  const [psychicsError, setPsychicsError] = useState(null);
  const [isLoadingHumanPsychics, setIsLoadingHumanPsychics] = useState(false);
  const [humanPsychicsError, setHumanPsychicsError] = useState(null);

  // Debounced email validation
  const validateEmail = useCallback(
    debounce((value) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (value && !emailRegex.test(value)) {
        setEmailError("Invalid email format.");
      } else {
        setEmailError("");
      }
    }, 500),
    []
  );

  // ========== DATA FETCHING ==========
  useEffect(() => {
    const fetchPsychics = async () => {
      setIsLoadingPsychics(true);
      setPsychicsError(null);
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/psychics`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        const data = response.data;
      
        if (data.success && Array.isArray(data.data)) {
          setPsychics(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch psychics");
        }
      } catch (error) {
        console.error("Error fetching psychics:", error);
        setPsychicsError(error.response?.data?.message || "Failed to load psychic profiles. Please try again.");
        toast.error(error.response?.data?.message || "Failed to load psychic profiles.");
      } finally {
        setIsLoadingPsychics(false);
      }
    };
    fetchPsychics();
  }, []);
const fetchPsychicRatingSummary = async (psychicId) => {
  try {
    console.log('Fetching rating summary for psychic:', psychicId);
    
    // Try both endpoints
    let endpoints = [
      `${import.meta.env.VITE_BASE_URL}/api/psychic/${psychicId}/summary`,
      `${import.meta.env.VITE_BASE_URL}/api/ratings/psychic/${psychicId}/summary`,
      `${import.meta.env.VITE_BASE_URL}/api/human-psychics/${psychicId}/summary`
    ];
    
    let response = null;
    let error = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log('Trying endpoint:', endpoint);
        response = await axios.get(endpoint, {
          timeout: 3000 // 3 second timeout
        });
        
        if (response.data && response.data.success) {
          console.log('Success from endpoint:', endpoint, response.data.data);
          return response.data.data;
        }
      } catch (err) {
        console.log('Endpoint failed:', endpoint, err.message);
        error = err;
      }
    }
    
    console.error('All endpoints failed for psychic:', psychicId);
    return null;
    
  } catch (error) {
    console.error('Error fetching rating summary:', error);
    return null;
  }
};
const getDummyAIPsychicRating = (psychicId) => {
  // Generate consistent dummy rating based on psychic ID
  const hash = psychicId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  const rating = 4.8 + (hash % 5) / 10; // Between 4.5 and 4.9
  const totalRatings = 50 + (hash % 50); // Between 50 and 100
  
  return {
    rating: rating.toFixed(1),
    fullStars: Math.floor(rating),
    hasHalfStar: rating % 1 >= 0.5,
    totalRatings,
    averageRating: rating
  };
};
  // Fet
  // ch human psychics data
 // Fetch human psychics data
useEffect(() => {
  const fetchHumanPsychicsWithFastStatus = async () => {
    setIsLoadingHumanPsychics(true);
    setHumanPsychicsError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/human-psychics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      
      const data = response.data;
      if (data.success && Array.isArray(data.psychics)) {
        // Inside fetchHumanPsychicsWithFastStatus function, after setting formattedPsychics:
const formattedPsychics = data.psychics.map(p => ({
  ...p,
  isHuman: true,
  type: p.type || "Human Psychic"
}));

// Fetch rating summaries for each human psychic
const ratingSummaryPromises = formattedPsychics.map(async (psychic) => {
  const summary = await fetchPsychicRatingSummary(psychic._id);
  return { psychicId: psychic._id, summary };
});

const summaries = await Promise.all(ratingSummaryPromises);
const summaryMap = {};
summaries.forEach(item => {
  if (item.summary) {
    summaryMap[item.psychicId] = item.summary;
  }
});
setRatingSummaries(prev => ({ ...prev, ...summaryMap }));

setHumanPsychics(formattedPsychics);
        // IMMEDIATELY fetch statuses for human psychics too
        const psychicIds = data.psychics.map(p => p._id);
        
        if (psychicIds.length > 0) {
          try {
            const statusResponse = await axios.post(
              `${import.meta.env.VITE_BASE_URL}/api/human-psychics/statuses-fast`,
              { psychicIds },
              { 
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                timeout: 2000
              }
            );
            
            if (statusResponse.data.success) {
              const newStatuses = {};
              Object.keys(statusResponse.data.statuses).forEach(id => {
                newStatuses[id] = {
                  status: statusResponse.data.statuses[id].status,
                  lastSeen: statusResponse.data.statuses[id].lastSeen,
                  lastActive: statusResponse.data.statuses[id].lastActive,
                  timestamp: Date.now()
                };
              });
              
              setPsychicStatuses(prev => ({
                ...prev,
                ...newStatuses
              }));
            }
          } catch (statusError) {
            console.warn("Human psychics fast status failed:", statusError);
          }
        }
        
      } else {
        throw new Error(data.message || "Failed to fetch human psychics");
      }
    } catch (error) {
      console.error("Error fetching human psychics:", error);
      setHumanPsychicsError(error.response?.data?.message || "Failed to load human psychic profiles. Please try again.");
      toast.error(error.response?.data?.message || "Failed to load human psychic profiles.");
    } finally {
      setIsLoadingHumanPsychics(false);
    }
  };
  
  fetchHumanPsychicsWithFastStatus();
}, []);



useEffect(() => {
  const token = localStorage.getItem('accessToken');
  const userId = user?._id || '';
  
  if (!userId) return;
  
  // Prevent duplicate socket creation
  if (socketRef.current?.connected) {
    console.log('ℹ️ Socket already connected');
    return;
  }

  console.log('🔄 Creating new socket connection...');
  
  const newSocket = io(`${import.meta.env.VITE_BASE_URL}`, {
    auth: {
      token,
      userId,
      role: 'user'
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socketRef.current = newSocket;
  setSocket(newSocket);

  // Connection events
  newSocket.on('connect', () => {
    console.log('✅ Socket.io connected:', newSocket.id);
    setSocketConnected(true);
    
    // Join global psychic list room
    newSocket.emit('join_room', 'psychic_list_status');
  });

  newSocket.on('disconnect', (reason) => {
    console.log('❌ Socket.io disconnected:', reason);
    setSocketConnected(false);
  });

  newSocket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    setSocketConnected(false);
  });

  // Consolidated psychic status handler
  const handlePsychicStatusUpdate = (data) => {
    console.log('🔄 Psychic status update:', {
      psychicId: data.psychicId,
      status: data.status,
      timestamp: new Date(data.timestamp).toLocaleTimeString()
    });
    
    setPsychicStatuses(prev => ({
      ...prev,
      [data.psychicId]: {
        status: data.status,
        lastSeen: data.lastSeen,
        lastActive: data.lastActive,
        lastUpdate: Date.now(),
        isOnline: data.status === 'online'
      }
    }));
  };

  // Listen for all status update events
  newSocket.on('psychic_status_changed', handlePsychicStatusUpdate);
  newSocket.on('psychic_status_update', handlePsychicStatusUpdate);
  newSocket.on('psychic_online', handlePsychicStatusUpdate);

  // Initial statuses response
  newSocket.on('psychic_statuses_response', (data) => {
    console.log('📋 Initial psychic statuses received');
    if (data.statuses && !data.error) {
      const newStatuses = {};
      Object.keys(data.statuses).forEach(psychicId => {
        newStatuses[psychicId] = {
          status: data.statuses[psychicId].status || 'offline',
          lastSeen: data.statuses[psychicId].lastSeen,
          lastActive: data.statuses[psychicId].lastActive,
          lastUpdate: Date.now(),
          isOnline: data.statuses[psychicId].status === 'online'
        };
      });
      setPsychicStatuses(prev => ({ ...prev, ...newStatuses }));
    }
  });

  // Cleanup on unmount
  return () => {
    console.log('🧹 Cleaning up socket connection');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    subscribedPsychicsRef.current.clear();
  };
}, [user?._id]);

// Smart subscription to psychic statuses
useEffect(() => {
  if (!socketConnected || !socketRef.current) return;

  const allPsychicIds = [
    ...psychics.map(p => p._id),
    ...humanPsychics.map(p => p._id)
  ].filter(id => id && !subscribedPsychicsRef.current.has(id));

  if (allPsychicIds.length === 0) return;

  console.log('📊 Subscribing to psychic statuses:', allPsychicIds);

  // Subscribe to status updates
  socketRef.current.emit('subscribe_to_psychic_status', { 
    psychicIds: allPsychicIds 
  });

  // Request initial statuses
  socketRef.current.emit('get_psychic_statuses', { 
    psychicIds: allPsychicIds 
  });

  // Add to subscribed set
  allPsychicIds.forEach(id => subscribedPsychicsRef.current.add(id));

  // Set up periodic status refresh (every 60 seconds)
  const refreshInterval = setInterval(() => {
    if (socketConnected && allPsychicIds.length > 0) {
      socketRef.current.emit('get_psychic_statuses', { 
        psychicIds: allPsychicIds 
      });
    }
  }, 60000);

  return () => clearInterval(refreshInterval);
}, [socketConnected, psychics, humanPsychics]);

// ========== OPTIMIZED HELPER FUNCTIONS ==========
const getPsychicStatus = (psychicId) => {
  const statusData = psychicStatuses[psychicId];
  if (!statusData) return 'offline';
  
  // If status is online but last update was more than 2 minutes ago, mark as away
  if (statusData.status === 'online' && statusData.lastUpdate) {
    const minutesSinceUpdate = (Date.now() - statusData.lastUpdate) / (1000 * 60);
    if (minutesSinceUpdate > 2) {
      return 'away';
    }
  }
  
  return statusData.status || 'offline';
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'online':
      return 'bg-emerald-500 text-white';
    case 'away':
      return 'bg-yellow-500 text-white';
    case 'busy':
      return 'bg-orange-500 text-white';
    case 'offline':
      return 'bg-gray-400 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Away';
    case 'busy':
      return 'Busy';
    case 'offline':
      return 'Offline';
    default:
      return 'Offline';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'online':
      return <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>;
    case 'away':
      return <div className="h-2 w-2 rounded-full bg-yellow-500"></div>;
    case 'busy':
      return <div className="h-2 w-2 rounded-full bg-orange-500"></div>;
    default:
      return <div className="h-2 w-2 rounded-full bg-gray-400"></div>;
  }
};

// Check if psychic is available for chat
const isPsychicAvailable = (psychicId) => {
  const status = getPsychicStatus(psychicId);
  return status === 'online' || status === 'away';
};

  // ========== OTHER EFFECTS ==========
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user && (localStorage.getItem("accessToken") || location.state?.fromLogin)) {
        try {
          const token = localStorage.getItem("accessToken");
          const { data } = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          setUser(data.user);
        } catch (err) {
          console.error("Failed to fetch user data:", err);
          localStorage.removeItem("accessToken");
          toast.error("Session expired. Please log in again.");
          navigate("/login");
        }
      }
    };
    fetchUserData();
  }, [user, navigate, setUser, location.state?.fromLogin]);

  useEffect(() => {
    if (user && (selectedPsychic?.type.toLowerCase() !== "tarot" || modalType === "lovePdf")) {
      const birthDate = user.dob ? new Date(user.dob).toISOString().split("T")[0] : "";
      setFormData((prev) => ({
        ...prev,
        yourFirstName: user.username || "",
        yourLastName: "",
        yourBirthDate: birthDate,
        yourBirthTime: user.birthTime || "",
        yourBirthPlace: user.birthPlace || "",
      }));
      if (!birthDate || !user.birthPlace) {
        toast.warning("Some profile details are missing. Please complete your profile in the dashboard for a seamless experience.");
      }
    }
  }, [user, selectedPsychic, modalType]);

  useEffect(() => {
    if (location.state?.numerologyReport) {
      setNumerologyReport(location.state.numerologyReport);
      setShowReportModal(true);
      navigate("/", { state: {}, replace: true });
    } else if (location.state?.astrologyReport) {
      setAstrologyReport(location.state.astrologyReport);
      setShowReportModal(true);
      navigate("/", { state: {}, replace: true });
    } else if (location.state?.monthlyForecastReport) {
      setMonthlyForecastReport(location.state.monthlyForecastReport);
      setShowReportModal(true);
      navigate("/", { state: {}, replace: true });
    } else if (location.state?.loveCompatibilityReport) {
      setLoveCompatibilityReport(location.state.loveCompatibilityReport);
      setShowReportModal(true);
      navigate("/", { state: {}, replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          toast.error("Authentication token missing. Please log in again.");
          navigate("/login");
          return;
        }
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/wallet`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserCredits(response.data.credits || 0);
      } catch (error) {
        console.error("Failed to fetch user credits:", error);
      }
    };
    fetchUserCredits();
  }, [user, navigate]);

  useEffect(() => {
    const fetchPdfReport = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/pdf-astrology-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        if (data.success && data.data.length > 0) {
          setPdfReport(data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching PDF Astrology report:", error);
      }
    };
    fetchPdfReport();
  }, [user]);

  useEffect(() => {
    const fetchLovePdfReport = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/love-pdf-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        if (data.success && data.data.length > 0) {
          setLovePdfReport(data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching Love PDF report:", error);
      }
    };
    fetchLovePdfReport();
  }, [user]);

  useEffect(() => {
    const fetchCoords = async (field, city) => {
      if (!city) return;
      try {
        setIsGeocoding(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/geocode?city=${encodeURIComponent(city)}`
        );
        const { latitude, longitude } = response.data;
        setFormData((prev) => ({
          ...prev,
          ...(field === "your" ? { yourLatitude: latitude, yourLongitude: longitude } : {}),
          ...(field === "partner" ? { partnerLatitude: latitude, partnerLongitude: longitude } : {}),
        }));
      } catch (err) {
        console.error(`Geocode failed for "${city}"`, err);
        toast.error(`Failed to fetch coordinates for ${field === "your" ? "your" : "partner's"} birth place. Please enter a valid city and country (e.g., Amsterdam, Netherlands).`);
      } finally {
        setIsGeocoding(false);
      }
    };
    if (selectedPsychic?.type === "Astrology" || selectedPsychic?.type === "Love" || modalType === "lovePdf") {
      if (formData.yourBirthPlace) fetchCoords("your", formData.yourBirthPlace);
      if (formData.partnerPlaceOfBirth) fetchCoords("partner", formData.partnerPlaceOfBirth);
    }
  }, [formData.yourBirthPlace, formData.partnerPlaceOfBirth, selectedPsychic?.type, modalType]);

  // ========== EVENT HANDLERS ==========
  const handleAstrologyUnlock = () => {
    if (!user) {
      toast.error("Please log in to unlock the astrology report");
      navigate("/login");
      return;
    }
    setModalType("astrology");
    setShowConfirmModal(true);
  };

  const handlePdfUnlock = async () => {
    if (!user) {
      toast.error("Please log in to unlock the PDF Astrology report");
      navigate("/login");
      return;
    }
    if (!user.gender) {
      toast.error("Please update your profile with your gender to unlock the PDF report.");
      navigate("/profile");
      return;
    }
    if (!user.username || !user.dob || !user.birthTime || !user.birthPlace) {
      toast.error("Please complete your profile with username, date of birth, birth time, and birth place.");
      navigate("/profile");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/generate-pdf-astrology-report`,
        { gender: user.gender.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      if (data.success) {
        setPdfReport(data.data);
        setUserCredits(data.credits);
        toast.success("PDF Astrology Report generated successfully!");
      } else {
        if (data.message.includes("Insufficient credits")) {
          setModalType("pdfAstrology");
          setShowPaymentModal(true);
        } else {
          toast.error(data.message || "Failed to generate PDF Astrology Report.");
        }
      }
    } catch (error) {
      console.error("PDF Astrology Generation Error:", error);
      toast.error(error.response?.data?.message || "Error generating PDF Astrology Report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLovePdfUnlock = async () => {
    if (!user) {
      toast.error("Please log in to unlock the Love PDF report");
      navigate("/login");
      return;
    }
    if (!user.username || !user.dob || !user.birthTime || !user.birthPlace) {
      toast.error("Please complete your profile with username, date of birth, birth time, and birth place.");
      navigate("/profile");
      return;
    }
    setModalType("lovePdf");
    setShowReportModal(true);
  };

  const handleLovePdfSubmit = async () => {
    if (!user) {
      toast.error("Please log in to proceed.");
      navigate("/login");
      return;
    }
    const requiredFields = [
      "yourFirstName",
      "yourBirthDate",
      "yourBirthPlace",
      "partnerFirstName",
      "partnerLastName",
      "partnerBirthDate",
      "partnerPlaceOfBirth",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]?.trim());
    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields
        .map((field) => field.replace(/([A-Z])/g, " $1").toLowerCase())
        .join(", ")}`);
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.yourBirthDate) || !dateRegex.test(formData.partnerBirthDate)) {
      toast.error("Invalid birth date format. Please use YYYY-MM-DD.");
      return;
    }
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (!nameRegex.test(formData.yourFirstName)) {
      toast.error("Your first name must contain only letters and spaces.");
      return;
    }
    if (!nameRegex.test(formData.partnerFirstName) || !nameRegex.test(formData.partnerLastName)) {
      toast.error("Partner's first and last names must contain only letters and spaces.");
      return;
    }
    const userDate = parse(formData.yourBirthDate, "yyyy-MM-dd", new Date());
    const partnerDate = parse(formData.partnerBirthDate, "yyyy-MM-dd", new Date());
    if (!isValid(userDate) || !isBefore(userDate, new Date()) || !isValid(partnerDate) || !isBefore(partnerDate, new Date())) {
      toast.error("Birth dates must be valid and in the past.");
      return;
    }
    if (formData.yourBirthPlace && !formData.yourLatitude) {
      toast.error("Please wait for geocoding to complete or enter a valid birth place.");
      return;
    }
    if (formData.partnerPlaceOfBirth && !formData.partnerLatitude) {
      toast.error("Please wait for geocoding to complete for partner's birth place.");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/generate-love-pdf-report`,
        {
          yourFirstName: formData.yourFirstName,
          yourBirthDate: formData.yourBirthDate,
          yourBirthTime: formData.yourBirthTime || "",
          yourBirthPlace: formData.yourBirthPlace,
          yourLatitude: Number(formData.yourLatitude) || null,
          yourLongitude: Number(formData.yourLongitude) || null,
          partnerFirstName: formData.partnerFirstName,
          partnerLastName: formData.partnerLastName,
          partnerBirthDate: formData.partnerBirthDate,
          partnerBirthTime: formData.partnerBirthTime || "",
          partnerPlaceOfBirth: formData.partnerPlaceOfBirth,
          partnerLatitude: Number(formData.partnerLatitude) || null,
          partnerLongitude: Number(formData.partnerLongitude) || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        setLovePdfReport(response.data.data);
        setUserCredits(response.data.credits);
        toast.success("Love PDF Report generated successfully!");
        setShowReportModal(false);
      } else {
        if (response.data.message.includes("Insufficient credits")) {
          setModalType("lovePdf");
          setShowPaymentModal(true);
        } else {
          toast.error(response.data.message || "Failed to generate Love PDF Report.");
        }
      }
    } catch (error) {
      console.error("Love PDF Generation Error:", error);
      toast.error(error.response?.data?.message || "Error generating Love PDF Report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmUnlock = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Authentication token missing. Please log in again.");
        navigate("/login");
        return;
      }
      let endpoint, creditCost, setReport, navigatePath;
      let payload = {
        yourName: user.username || "",
        birthDate: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
        birthTime: user.birthTime || "",
        birthPlace: user.birthPlace || "",
      };
      if (modalType === "astrology") {
        endpoint = `${import.meta.env.VITE_BASE_URL}/api/astrology-report`;
        creditCost = 5;
        setReport = setAstrologyReport;
        navigatePath = "/astrology-report";
      } else if (modalType === "monthlyForecast") {
        endpoint = `${import.meta.env.VITE_BASE_URL}/api/monthly-forecast`;
        creditCost = 5;
        setReport = setMonthlyForecastReport;
        navigatePath = "/monthly-forecast";
      } else {
        throw new Error("Invalid report type");
      }
      if (modalType === "astrology") {
        payload = {
          ...payload,
          ...(formData.yourLatitude && { latitude: Number(formData.yourLatitude) }),
          ...(formData.yourLongitude && { longitude: Number(formData.yourLongitude) }),
        };
      }
      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        setNumerologyReport(null);
        setAstrologyReport(null);
        setLoveCompatibilityReport(null);
        setMonthlyForecastReport(null);
        setReport(response.data.data);
        setUserCredits(response.data.credits);
        toast.success(`${modalType === "astrology" ? "Astrology" : "Monthly Forecast"} report unlocked successfully!`);
        navigate(navigatePath, { state: { [modalType + "Report"]: response.data.data } });
      } else {
        if (response.data.message === "Insufficient credits") {
          setModalType(modalType);
          setShowPaymentModal(true);
        } else if (response.data.message.includes("Invalid birth place")) {
          toast.error("Invalid birth place provided. Please update your profile with a valid city and country (e.g., Amsterdam, Netherlands).");
          navigate("/dashboard");
        } else {
          toast.error(response.data.message || `Failed to generate ${modalType} report`);
        }
      }
    } catch (error) {
      console.error(`Error generating ${modalType} report:`, error);
      toast.error(error.response?.data?.message || `An error occurred while generating the ${modalType} report`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentRedirect = () => {
    navigate("/payment");
    setShowPaymentModal(false);
  };

  const handleShowMore = () => setShowing((prev) => Math.min(prev + 4, humanPsychics.length));

  const handlePsychicSelect = async (psychic) => {
    if (!user) {
      toast.error("Please log in to connect with a psychic");
      navigate("/login");
      return;
    }
    
    const psychicStatus = getPsychicStatus(psychic._id);
    const isAvailable = isPsychicAvailable(psychic._id);

    // Check if psychic is available (not offline or busy)
    if (psychic.isHuman && (psychicStatus === 'offline' || psychicStatus === 'busy')) {
      toast.error(`This psychic is currently ${psychicStatus.toLowerCase()}. Please try again later.`);
      return;
    }
    
    setSelectedPsychic(psychic);
    
    // For AI Psychics
    if (!psychic.isHuman) {
      if (psychic.type.toLowerCase() === "tarot") {
        setIsSubmitting(true);
        try {
          const token = localStorage.getItem("accessToken");
          const checkResponse = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/chat/check-session/${psychic._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (checkResponse.data.exists) {
            navigate(`/chat/${psychic._id}`, {
              state: {
                chatSession: checkResponse.data.session,
                psychic: psychic,
                isAI: true
              }
            });
            return;
          }
          
          const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/api/chat/sessions`,
            { psychicId: psychic._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.success) {
            navigate(`/chat/${psychic._id}`, {
              state: {
                chatSession: response.data.chatSession,
                psychic: psychic,
                isAI: true
              }
            });
          } else {
            toast.error(response.data.message || "Failed to start AI chat.");
          }
        } catch (error) {
          console.error("AI Chat session error:", error);
          if (error.response?.status === 404) {
            navigate(`/chat/${psychic._id}`, {
              state: {
                psychic: psychic,
                isAI: true
              }
            });
          } else {
            toast.error(error.response?.data?.message || "Error initiating AI chat.");
          }
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setShowReportModal(true);
      }
      return;
    }
    
    // For Human Psychics
    if (psychic.isHuman) {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem("accessToken");
        
        // Check for existing session
        try {
          const check = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/humanchat/sessions/check/${psychic._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (check.data.exists) {
            navigate(`/message/${psychic._id}`, {
              state: {
                chatSession: check.data.session,
                psychic: psychic,
                fromHome: true,
                timestamp: Date.now()
              }
            });
            return;
          }
        } catch (checkError) {
          console.log("No existing session found, creating new one");
        }
        
        // Create new session
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/humanchat/sessions`,
          { psychicId: psychic._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          navigate(`/message/${psychic._id}`, {
            state: {
              chatSession: response.data.chatSession,
              psychic: psychic,
              fromHome: true,
              timestamp: Date.now()
            }
          });
        } else {
          toast.error(response.data.message || "Failed to start chat.");
          navigate(`/message/${psychic._id}`, {
            state: {
              psychic: psychic,
              fromHome: true
            }
          });
        }
      } catch (error) {
        console.error("Human chat session error:", error);
        toast.info("Connecting to chat...");
        navigate(`/message/${psychic._id}`, {
          state: {
            psychic: psychic,
            fromHome: true
          }
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (value && !nameRegex.test(value)) {
        toast.error("Name must contain only letters and spaces.");
        return;
      }
    }
    if (name === "dob") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (value && !dateRegex.test(value)) {
        toast.error("Invalid date format for Date of Birth. Use YYYY-MM-DD.");
        return;
      }
      const date = parse(value, "yyyy-MM-dd", new Date());
      if (value && (!isValid(date) || !isBefore(date, new Date()))) {
        toast.error("Date of Birth must be valid and in the past.");
        return;
      }
      const [year, month, day] = value.split("-").map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth || (month === 2 && day === 29 && !isLeapYear(year))) {
        toast.error("Invalid day for Date of Birth. Check leap year or days in month.");
        return;
      }
    }
    if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value.trim() }));
      validateEmail(value);
      return;
    }
    if (name === "birthTime") {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (value && !timeRegex.test(value)) {
        toast.error("Invalid time format for Birth Time. Use HH:MM (24-hour).");
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
  };

  const handleNumerologyFormSubmit = async () => {
    const requiredFields = ["name", "dob", "email"];
    const missingFields = requiredFields.filter((field) => !formData[field]?.trim());
    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields
        .map((field) => field.replace(/([A-Z])/g, " $1").toLowerCase())
        .join(", ")}`);
      return;
    }
    if (emailError) {
      toast.error("Please fix the email format before submitting.");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/generate-numerology-report`,
        {
          name: formData.name,
          dob: formData.dob,
          email: formData.email,
          birthTime: formData.birthTime || null,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        localStorage.setItem(
          "numerologyFormData",
          JSON.stringify({
            name: formData.name,
            email: formData.email,
            dob: formData.dob,
            birthTime: formData.birthTime || null,
          })
        );
        setNumerologyReport(response.data.data);
        setShowFormModal(false);
        navigate("/numerology-report", {
          state: {
            numerologyReport: response.data.data,
            userData: {
              name: formData.name,
              dob: formData.dob,
              email: formData.email,
              birthTime: formData.birthTime || null,
            },
          },
        });
        toast.success("Numerology report generated successfully!");
      } else {
        toast.error(response.data.message || "Failed to generate numerology report.");
      }
    } catch (error) {
      console.error("Numerology Report Generation Error:", error);
      toast.error(error.response?.data?.message || "Error generating numerology report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!selectedPsychic || !user) {
      toast.error("Please select a psychic and ensure you are logged in.");
      return;
    }
    const type = selectedPsychic.type.toLowerCase();
    const requiredFields = {
      astrology: ["yourFirstName", "yourBirthDate", "yourBirthPlace"],
      love: [
        "yourFirstName",
        "yourBirthDate",
        "yourBirthPlace",
        "partnerFirstName",
        "partnerLastName",
        "partnerBirthDate",
        "partnerPlaceOfBirth",
      ],
      numerology: ["yourFirstName", "yourBirthDate"],
      tarot: [],
    }[type] || [];
    
    if (type !== "tarot") {
      const missingFields = requiredFields.filter((field) => !formData[field]?.trim());
      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields
          .map((field) => field.replace(/([A-Z])/g, " $1").toLowerCase())
          .join(", ")}`);
        return;
      }
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (!nameRegex.test(formData.yourFirstName)) {
        toast.error("Your first name must contain only letters and spaces.");
        return;
      }
      if (type === "astrology" && formData.yourLastName && !nameRegex.test(formData.yourLastName)) {
        toast.error("Your last name must contain only letters and spaces.");
        return;
      }
      if (type === "love" && (!nameRegex.test(formData.partnerFirstName) || !nameRegex.test(formData.partnerLastName))) {
        toast.error("Partner's first and last names must contain only letters and spaces.");
        return;
      }
      if (type === "astrology" || type === "love") {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.yourBirthDate) || (type === "love" && !dateRegex.test(formData.partnerBirthDate))) {
          toast.error("Invalid birth date format. Please use YYYY-MM-DD.");
          return;
        }
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (formData.yourBirthTime && !timeRegex.test(formData.yourBirthTime)) {
          toast.error("Invalid time format for Your Birth Time. Please use HH:MM (24-hour).");
          return;
        }
        if (type === "love" && formData.partnerBirthTime && !timeRegex.test(formData.partnerBirthTime)) {
          toast.error("Invalid time format for Partner's Birth Time. Please use HH:MM (24-hour).");
          return;
        }
        const userDate = parse(formData.yourBirthDate, "yyyy-MM-dd", new Date());
        if (!isValid(userDate) || !isBefore(userDate, new Date())) {
          toast.error("Your Birth Date must be valid and in the past.");
          return;
        }
        if (type === "love") {
          const partnerDate = parse(formData.partnerBirthDate, "yyyy-MM-dd", new Date());
          if (!isValid(partnerDate) || !isBefore(partnerDate, new Date())) {
            toast.error("Partner's Birth Date must be valid and in the past.");
            return;
          }
        }
        if (formData.yourBirthPlace && !formData.yourLatitude) {
          toast.error("Please wait for geocoding to complete or enter a valid birth place.");
          return;
        }
        if (type === "love" && formData.partnerPlaceOfBirth && !formData.partnerLatitude) {
          toast.error("Please wait for geocoding to complete for partner's birth place.");
          return;
        }
      }
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Authentication token missing. Please log in again.");
        navigate("/login");
        return;
      }
      
      const payload = {
        psychicId: selectedPsychic._id,
        formData: {
          ...(type === "astrology" && {
            yourName: `${formData.yourFirstName} ${formData.yourLastName || ""}`.trim(),
            birthDate: formData.yourBirthDate,
            birthTime: formData.yourBirthTime,
            birthPlace: formData.yourBirthPlace,
            latitude: Number(formData.yourLatitude) || null,
            longitude: Number(formData.yourLongitude) || null,
          }),
          ...(type === "numerology" && {
            yourName: formData.yourFirstName.trim(),
            birthDate: formData.yourBirthDate,
          }),
          ...(type === "love" && {
            yourName: `${formData.yourFirstName} ${formData.yourLastName || ""}`.trim(),
            yourBirthDate: formData.yourBirthDate,
            yourBirthTime: formData.yourBirthTime,
            yourBirthPlace: formData.yourBirthPlace,
            yourLatitude: Number(formData.yourLatitude) || null,
            yourLongitude: Number(formData.yourLongitude) || null,
            partnerName: `${formData.partnerFirstName} ${formData.partnerLastName}`.trim(),
            partnerBirthDate: formData.partnerBirthDate,
            partnerBirthTime: formData.partnerBirthTime,
            partnerPlaceOfBirth: formData.partnerPlaceOfBirth,
            partnerLatitude: Number(formData.partnerLatitude) || null,
            partnerLongitude: Number(formData.partnerLongitude) || null,
          }),
          ...(type === "tarot" && {}),
        },
      };
      
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/form/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.data.success) {
        toast.success(`${selectedPsychic.type} reading data saved successfully!`);
        
        setIsSubmitting(true);
        try {
          const checkResponse = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/chat/check-session/${selectedPsychic._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          let chatSession;
          if (checkResponse.data.exists) {
            chatSession = checkResponse.data.session;
          } else {
            const createResponse = await axios.post(
              `${import.meta.env.VITE_BASE_URL}/api/chat/sessions`,
              { psychicId: selectedPsychic._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (createResponse.data.success) {
              chatSession = createResponse.data.chatSession;
            } else {
              throw new Error(createResponse.data.message || "Failed to start AI chat.");
            }
          }
          
          setShowReportModal(false);
          navigate(`/chat/${selectedPsychic._id}`, {
            state: {
              chatSession,
              psychic: selectedPsychic,
              isAI: true
            }
          });
          
        } catch (sessionError) {
          console.error("AI Chat session error:", sessionError);
          if (sessionError.response?.status === 404) {
            navigate(`/chat/${selectedPsychic._id}`, {
              state: {
                psychic: selectedPsychic,
                isAI: true
              }
            });
          } else {
            toast.error(sessionError.response?.data?.message || "Error initiating AI chat.");
          }
        } finally {
          setIsSubmitting(false);
        }
        
      } else {
        toast.error(response.data.message || "Failed to save reading data.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      if (error.response?.data?.message?.includes("Invalid birth place")) {
        toast.error("Invalid birth place provided. Please enter a valid city and country (e.g., Amsterdam, Netherlands).");
      } else if (error.response?.data?.message?.includes("Missing required fields")) {
        toast.error(`Missing required fields: ${error.response.data.message.split(":")[1] || "please check your input."}`);
      } else {
        toast.error(error.response?.data?.message || "An error occurred while saving the reading data.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== RENDER FUNCTIONS ==========
  const renderFormFields = () => {
    if (!selectedPsychic && modalType !== "lovePdf" && modalType !== "loveCompatibility") return null;
    const type = selectedPsychic?.type?.toLowerCase() || modalType;
    const commonInput = (label, name, type = "text", placeholder = "", required = false) => (
      <div className="space-y-2">
        <Label>{label}{required ? " *" : ""}</Label>
        <Input
          type={type}
          name={name}
          value={formData[name] || ""}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
        />
      </div>
    );
    
    switch (type) {
      case "numerology":
        return (
          <>
            {commonInput("Your First Name", "yourFirstName", "text", "Your first name", true)}
            {commonInput("Your Date of Birth", "yourBirthDate", "date", "", true)}
          </>
        );
      case "love":
      case "loveCompatibility":
      case "lovePdf":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              {commonInput("Your First Name", "yourFirstName", "text", "Your first name", true)}
              {commonInput("Your Last Name", "yourLastName", "text", "Your last name", false)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {commonInput("Your Date of Birth", "yourBirthDate", "date", "", true)}
              {commonInput("Your Time of Birth", "yourBirthTime", "time", "", false)}
            </div>
            {commonInput("Your Place of Birth", "yourBirthPlace", "text", "City, Country", true)}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Partner Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {commonInput("Partner's First Name", "partnerFirstName", "text", "Partner's first name", true)}
                {commonInput("Partner's Last Name", "partnerLastName", "text", "Partner's last name", true)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {commonInput("Partner's Date of Birth", "partnerBirthDate", "date", "", true)}
                {commonInput("Partner's Time of Birth", "partnerBirthTime", "time", "", false)}
              </div>
              {commonInput("Partner's Place of Birth", "partnerPlaceOfBirth", "text", "City, Country", true)}
            </div>
          </>
        );
      case "astrology":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              {commonInput("Your First Name", "yourFirstName", "text", "Your first name", true)}
              {commonInput("Your Last Name", "yourLastName", "text", "Your last name", false)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {commonInput("Your Date of Birth", "yourBirthDate", "date", "", true)}
              {commonInput("Your Time of Birth", "yourBirthTime", "time", "", false)}
            </div>
            {commonInput("Your Place of Birth", "yourBirthPlace", "text", "City, Country", true)}
          </>
        );
      case "tarot":
        return (
          <p className="text-gray-600 dark:text-gray-300">
            No additional information is required for your Tarot reading. Click "Start Reading" to begin your session.
          </p>
        );
      default:
        return null;
    }
  };

  const renderAstrologyReport = () => {
    if (!astrologyReport) return null;
    const { narrative, chart, numerology } = astrologyReport;
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold text-center">Your Astrological Blueprint</h2>
        {isSubmitting ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line text-gray-700">{narrative}</p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Sun Sign: {chart.sun.sign} (House {chart.sun.house})</h3>
                <p className="text-gray-600">{chart.sun.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Moon Sign: {chart.moon.sign} (House {chart.moon.house})</h3>
                <p className="text-gray-600">{chart.moon.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Venus Sign: {chart.venus.sign} (House {chart.venus.house})</h3>
                <p className="text-gray-600">{chart.venus.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Mars Sign: {chart.mars.sign} (House {chart.mars.house})</h3>
                <p className="text-gray-600">{chart.mars.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Mercury Sign: {chart.mercury.sign} (House {chart.mercury.house})</h3>
                <p className="text-gray-600">{chart.mercury.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Jupiter Sign: {chart.jupiter.sign} (House {chart.jupiter.house})</h3>
                <p className="text-gray-600">{chart.jupiter.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Saturn Sign: {chart.saturn.sign} (House {chart.saturn.house})</h3>
                <p className="text-gray-600">{chart.saturn.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Life Path Number: {numerology.lifePath.number}</h3>
                <p className="text-gray-600">{numerology.lifePath.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Heart's Desire Number: {numerology.heart.number}</h3>
                <p className="text-gray-600">{numerology.heart.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Expression Number: {numerology.expression.number}</h3>
                <p className="text-gray-600">{numerology.expression.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Personality Number: {numerology.personality.number}</h3>
                <p className="text-gray-600">{numerology.personality.description}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setAstrologyReport(null);
                  navigate("/astrology-report", { state: { astrologyReport } });
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                View Full Report
              </Button>
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setAstrologyReport(null);
                  navigate("/");
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderLoveCompatibilityReport = () => {
    if (!loveCompatibilityReport) return null;
    const { narrative, compatibility } = loveCompatibilityReport;
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold text-center">Your Love Compatibility Report</h2>
        {isSubmitting ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line text-gray-700">{narrative}</p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Compatibility Score: {compatibility.score}</h3>
                <p className="text-gray-600">{compatibility.description}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setLoveCompatibilityReport(null);
                  navigate("/love-compatibility", { state: { loveCompatibilityReport } });
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                View Full Report
              </Button>
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setLoveCompatibilityReport(null);
                  navigate("/");
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMonthlyForecastReport = () => {
    if (!monthlyForecastReport) return null;
    const { narrative, chart, forecast, predictionMonth, predictionYear } = monthlyForecastReport;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold text-center">Your Monthly Forecast for {monthNames[predictionMonth - 1]} {predictionYear}</h2>
        {isSubmitting ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="prose max-w-none">
              <p className="whitespace-pre-line text-gray-700">{narrative}</p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Overview</h3>
                <p className="text-gray-600">{forecast.overview}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Career & Purpose</h3>
                <p className="text-gray-600">{forecast.career}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Relationships & Connections</h3>
                <p className="text-gray-600">{forecast.relationships}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Personal Growth & Spirituality</h3>
                <p className="text-gray-600">{forecast.personalGrowth}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Challenges & Practical Advice</h3>
                <p className="text-gray-600">{forecast.challenges}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Sun Sign: {chart.sun.sign}</h3>
                <p className="text-gray-600">{chart.sun.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Moon Sign: {chart.moon.sign}</h3>
                <p className="text-gray-600">{chart.moon.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Ascendant: {chart.ascendant.sign}</h3>
                <p className="text-gray-600">{chart.ascendant.description}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setMonthlyForecastReport(null);
                  navigate("/monthly-forecast", { state: { monthlyForecastReport } });
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                View Full Report
              </Button>
              <Button
                onClick={() => {
                  setShowReportModal(false);
                  setMonthlyForecastReport(null);
                  navigate("/");
                }}
                variant="outline"
                className="w-full sm:flex-1"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderNumerologyForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Name *</Label>
        <br></br>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="First Name"
          required
          className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
        />
      </div>
      <div>
        <Label>Date of Birth *</Label>
        <br></br>
        <Input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleInputChange}
          required
          className="rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
        />
      </div>
      <div>
        <Label>Email *</Label>
        <br></br>
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter your email"
          className={`w-full ${emailError ? "border-red-500" : ""}`}
        />
        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
      </div>
  
      <Button
        onClick={handleNumerologyFormSubmit}
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600"
      >
        {isSubmitting ? "Generating..." : "Generate Numerology Report"}
      </Button>
    </div>
  );

  const renderNumerologyReport = () => (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-center">Uw Numerologie Rapport</h2>
      <p className="text-lg whitespace-pre-line">{numerologyReport.narrative}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xl font-semibold">Levenspadgetal: {numerologyReport.numbers.lifePath.number}</h3>
          <p>{numerologyReport.numbers.lifePath.description}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Expressiegetal: {numerologyReport.numbers.expression.number}</h3>
          <p>{numerologyReport.numbers.expression.description}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Hartgetal: {numerologyReport.numbers.soulUrge.number}</h3>
          <p>{numerologyReport.numbers.soulUrge.description}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Persoonlijkheidsgetal: {numerologyReport.numbers.personality.number}</h3>
          <p>{numerologyReport.numbers.personality.description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="">
      <div className="relative w-full overflow-hidden">
        <img
          src="/images/banner.jpeg"
          className="w-full h-[400px] sm:h-[600px] object-cover"
          alt="banner"
        />
        <div className="absolute top-1/2 sm:top-[80%] left-1/2 -translate-y-1/2 sm:-translate-y-[80%] -translate-x-1/2 w-full px-4">
          <h1
            style={{ fontFamily: "Roboto" }}
            className="text-3xl max-[500px]:text-2xl sm:text-4xl lg:text-[52px] leading-tight font-sans font-extrabold uppercase text-white text-center"
          >
            DE NATIONALE HULPLIJN <br />VOOR ELKAAR MET ELKAAR
          </h1>
          <img
            src="/images/newLogo.jpg"
            className="md:w-20 md:h-20 w-12 h-12 m-auto rounded-full object-cover"
            alt="logo"
          />
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-900 text-white py-12 px-4 sm:px-6 overflow-x-hidden">
        <div className="max-w-[100vw] mx-auto text-center overflow-x-hidden">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ontdek uw spirituele blauwdruk
          </h1>
          <p className="text-base sm:text-lg mb-6 opacity-90 max-w-[90vw] mx-auto">
            Ontgrendel persoonlijke inzichten in uw spirituele reis
          </p>
       
          <>
            {!user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: [1, 1.2, 0.95, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="brand"
                  className="rounded-full px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg
                    bg-gradient-to-r from-amber-400 to-amber-500
                    hover:from-amber-500 hover:to-amber-600
                    shadow-xl hover:shadow-2xl
                    transition-all duration-300
                    border-2 border-white/20 whitespace-normal"
                  onClick={() => navigate("/register")}
                >
Klik hier om gratis met een coach te chatten                </Button>
              </motion.div>
            )}
          </>
          <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Uw Numerologie Rapport</DialogTitle>
                <DialogDescription>
                  Vul uw gegevens in om uw gepersonaliseerde numerologie rapport te genereren.
                </DialogDescription>
              </DialogHeader>
              {renderNumerologyForm()}
            </DialogContent>
          </Dialog>
          <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              {numerologyReport && renderNumerologyReport()}
              {astrologyReport && renderAstrologyReport()}
              {loveCompatibilityReport && renderLoveCompatibilityReport()}
              {monthlyForecastReport && renderMonthlyForecastReport()}
            </DialogContent>
          </Dialog>
          <div className="mt-6 flex justify-center gap-4 flex-wrap max-w-[90vw]">
            <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center gap-1 shadow-md text-sm py-1 px-2">
              <Lock className="h-4 w-4" /> SSL Secure
            </Badge>
            <Badge className="bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white flex items-center gap-1 shadow-md text-sm py-1 px-2" style={{ animationDelay: '0.3s' }}>
              <Cpu className="h-4 w-4" /> AI-Powered
            </Badge>
          </div>
        </div>
      </div>
      <div className="max-w-7xl px-2 m-auto">
        <div className="mt-8 grid grid-cols-1 gap-6">
          <div className="lg:col-span-2 space-y-2 w-full">
            <div className="w-full overflow-hidden">
              <ProfileSection1 />
            </div>
            <div className="wrapper">
              <Tabs defaultValue="active">
                <TabsContent value="active">
                  {/* Human Psychics First */}
                  {isLoadingHumanPsychics ? (
                    <div className="flex justify-center p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : humanPsychicsError ? (
                    <p className="text-red-600 text-center">{humanPsychicsError}</p>
                  ) : humanPsychics.length === 0 ? (
                    <p className="text-gray-600 text-center">No human psychics available at the moment.</p>
                  ) : (
                    <div className="grid gap-8 mb-10 w-full">
                      {humanPsychics.slice(0, showing).map((psychic, i) => {
                        const psychicStatus = getPsychicStatus(psychic._id);
                       
                        return (
                          <div
                            key={psychic._id || i}
                            className="overflow-hidden w-full rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                          >
                            <div className="p-6">
                              <div className="flex flex-col gap-6 md:flex-row">
                                <div className="flex flex-col items-center lg:w-64">
                                  <div className="relative rounded-full border-4 border-violet-100 dark:border-violet-900">
                                    <img
                                      src={psychic.image}
                                      alt={psychic.name}
                                      className="object-cover h-32 w-32 rounded-full"
                                    />
                                  </div>
                                  <div className="mt-4 text-center">
                                    <h3 className="text-xl font-semibold">{psychic.name}</h3>
                                    <p className="text-slate-700 dark:text-slate-200">Human Psychic</p>
                                    <div className="mt-1 flex items-center justify-center">
                                      {Array(Math.round(psychic.rating?.avgRating || 0))
                                        .fill(0)
                                        .map((_, i) => (
                                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    {/* Human Psychic Status Badge */}
                                  <div className="mt-2 flex items-center justify-center gap-2">
  {getStatusIcon(psychicStatus)}
  <Badge className={`${getStatusBadgeColor(psychicStatus)}`}>
    {getStatusText(psychicStatus)}
  </Badge>
</div>
                                  </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                  <div className="flex flex-wrap gap-2">
                                    {psychic.abilities?.map((ability, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                                      >
                                        {ability}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300">{psychic.bio}</p>
                             <div className="mt-4">
  <h4 className="font-medium text-gray-900 dark:text-white">Latest Review</h4>
  <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
    {ratingSummaries[psychic._id]?.latestReviews?.[0] ? (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < (ratingSummaries[psychic._id]?.latestReviews[0]?.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            <span className="text-sm font-medium">
              {(ratingSummaries[psychic._id]?.latestReviews[0]?.rating || 0).toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {ratingSummaries[psychic._id]?.latestReviews[0]?.createdAt && 
              new Date(ratingSummaries[psychic._id].latestReviews[0].createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          "{ratingSummaries[psychic._id]?.latestReviews[0]?.review || 
            ratingSummaries[psychic._id]?.latestReviews[0]?.comment || 
            ratingSummaries[psychic._id]?.latestReviews[0]?.message || 
            'Great experience!'}"
        </p>
        {ratingSummaries[psychic._id]?.latestReviews[0]?.user?.username && (
          <p className="text-xs text-gray-500">
            - {ratingSummaries[psychic._id].latestReviews[0].user.username}
          </p>
        )}
        {ratingSummaries[psychic._id]?.latestReviews[0]?.user?.firstName && (
          <p className="text-xs text-gray-500">
            - {ratingSummaries[psychic._id].latestReviews[0].user.firstName}
          </p>
        )}
      </div>
    ) : ratingSummaries[psychic._id]?.averageRating ? (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(ratingSummaries[psychic._id]?.averageRating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          <span className="text-sm font-medium">
            {ratingSummaries[psychic._id]?.averageRating?.toFixed(1) || '0.0'}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {ratingSummaries[psychic._id]?.totalRatings || 0} reviews
        </p>
      </div>
    ) : (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i}
                className="h-3 w-3 text-gray-300"
              />
            ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No reviews yet. Be the first to review!
        </p>
      </div>
    )}
  </div>
</div>

                                  <div className="mt-6 flex flex-wrap gap-3">
                                    <Button
                                      variant="brand"
                                      className="rounded-full gap-2"
                                      onClick={() => handlePsychicSelect(psychic)}
                                      disabled={isSubmitting || psychicStatus === 'offline' || psychicStatus === 'busy'}
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      {psychicStatus === 'offline' || psychicStatus === 'busy'
                                        ? (psychicStatus === 'offline' ? 'Offline' : 'Busy')
                                        : `Chat Now`}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="rounded-full gap-2"
                                      onClick={() => navigate(`/psychic/${psychic._id}`)}
                                    >
                                      View Profile
                                    </Button>
                                  </div>
                                  {(psychicStatus === 'offline' || psychicStatus === 'busy') && (
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                      {psychicStatus === 'offline'
                                        ? "This psychic is currently offline. You can still view their profile."
                                        : "This psychic is currently busy. Please try again later."}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {showing < humanPsychics.length && (
                        <Button onClick={handleShowMore} variant="brand">
                          Show More
                        </Button>
                      )}
                    </div>
                  )}
                  {/* AI Coach at the Bottom */}
                  <h2 className="text-2xl font-bold mb-4">Astrology AI Coach</h2>
                  {isLoadingPsychics ? (
                    <div className="flex justify-center p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : psychicsError ? (
                    <p className="text-red-600 text-center">{psychicsError}</p>
                  ) : psychics.length === 0 ? (
                    <p className="text-gray-600 text-center">No AI coach available at the moment.</p>
                  ) : (
                    <div className="grid gap-8 mb-10 w-full">
                      {psychics.map((psychic, i) => (
                        <div
                          key={psychic._id || i}
                          className="overflow-hidden w-full rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                        >
                          <div className="p-6">
                            <div className="flex flex-col gap-6 md:flex-row">
                              <div className="flex flex-col items-center lg:w-64">
                                <div className="relative rounded-full border-4 border-violet-100 dark:border-violet-900">
                                  <img
                                    src={psychic.image}
                                    alt={psychic.name}
                                    className="object-cover h-32 w-32 rounded-full"
                                  />
                                </div>
                                <div className="mt-4 text-center">
                                  <h3 className="text-xl font-semibold">{psychic.name}</h3>
                                  <p className="text-slate-700 dark:text-slate-200">{psychic.type}</p>
                                  <div className="mt-1 flex items-center justify-center">
                                    {Array(Math.round(psychic.rating?.avgRating || 0))
                                      .fill(0)
                                      .map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                      ))}
                                  </div>
                                  {/* AI Psychics - Always Available */}
                                  <Badge className="mt-2 bg-emerald-500">Available</Badge>
                                </div>
                              </div>
                              <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  {psychic.abilities?.map((ability, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                                    >
                                      {ability}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">{psychic.bio}</p>
           <div className="mt-4">
  <h4 className="font-medium text-gray-900 dark:text-white">Rating</h4>
  <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
    {(() => {
      const dummyRating = getDummyAIPsychicRating(psychic._id);
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="relative">
                    <Star
                      className={`h-4 w-4 ${
                        i < dummyRating.fullStars 
                          ? "fill-amber-400 text-amber-400" 
                          : "text-gray-300"
                      }`}
                    />
                    {i === dummyRating.fullStars && dummyRating.hasHalfStar && (
                      <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      </div>
                    )}
                  </div>
                ))}
              <span className="text-sm font-medium">{dummyRating.rating}</span>
            </div>
            <span className="text-xs text-gray-500">
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            AI-powered insights with consistent high performance
          </p>
        </div>
      );
    })()}
  </div>
</div>
               <div className="mt-6 flex flex-wrap gap-3">
                                  <Button
                                    variant="brand"
                                    className="rounded-full gap-2"
                                    onClick={() => handlePsychicSelect(psychic)}
                                    disabled={isSubmitting}
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    Chat Now
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="rounded-full gap-2"
                                    onClick={() => navigate(`/psychic/${psychic._id}`)}
                                  >
                                    View Profile
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
         
          <div className="mt-12 py-8">
            <h2 className="text-3xl font-extrabold text-center mb-8">Ontgrendel diepere inzichten</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 mb-6">
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-semibold mb-4">PDF Astrologierapport</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Ontvang een uitgebreid PDF-rapport met uw volledige horoscoop en analyses.
                </p>
                {pdfReport ? (
                  <Button
                    variant="brand"
                    className="w-full rounded-full"
                    onClick={() => window.open(pdfReport.pdfUrl, "_blank")}
                  >
                    Bekijk PDF
                  </Button>
                ) : (
                  <Button
                    variant="brand"
                    className="w-full rounded-full"
                    onClick={() => {
                      if (window.confirm("Dit kost 15 credits. Doorgaan?")) {
                        handlePdfUnlock();
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Verwerken..." : "Ontgrendel (15 credits)"}
                  </Button>
                )}
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-semibold mb-4">Astrologische blauwdruk</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Ontdek uw kosmische blauwdruk met een persoonlijk astrologierapport, dat inzichten onthult vanuit uw zon-, maan- en ascendantteken.
                </p>
                <Button
                  variant="brand"
                  className="w-full rounded-full"
                  onClick={handleAstrologyUnlock}
                  disabled={isSubmitting}
                >
                  Ontgrendel astrologierapport (5 credits)
                </Button>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-semibold mb-4">PDF Liefdescompatibiliteitsrapport</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Ontvang een gedetailleerd PDF-rapport dat de compatibiliteit tussen u en uw partner analyseert op basis van astrologische profielen.
                </p>
                {lovePdfReport ? (
                  <Button
                    variant="brand"
                    className="w-full rounded-full"
                    onClick={() => window.open(lovePdfReport.pdfUrl, "_blank")}
                  >
                    Bekijk PDF
                  </Button>
                ) : (
                  <Button
                    variant="brand"
                    className="w-full rounded-full"
                    onClick={() => {
                      if (window.confirm("Dit kost 15 credits. Doorgaan?")) {
                        handleLovePdfUnlock();
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Verwerken..." : "Ontgrendel (15 credits)"}
                  </Button>
                )}
              </div>
            </div>
            <VideoSection />
          </div>
        </div>
      </div>
      <Dialog
        open={showReportModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowReportModal(false);
            setNumerologyReport(null);
            setAstrologyReport(null);
            setLoveCompatibilityReport(null);
            setMonthlyForecastReport(null);
            setSelectedPsychic(null);
            setModalType(null);
          }
        }}
      >
        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-xl shadow-lg z-50 focus:outline-none p-0">
          <div className="max-h-[90vh] overflow-y-auto">
            {numerologyReport ? (
              renderNumerologyReport()
            ) : astrologyReport ? (
              renderAstrologyReport()
            ) : loveCompatibilityReport ? (
              renderLoveCompatibilityReport()
            ) : monthlyForecastReport ? (
              renderMonthlyForecastReport()
            ) : modalType === "lovePdf" ? (
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-semibold text-center">Love Compatibility PDF Report</h2>
                <div className="space-y-4">
                  {renderFormFields()}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowReportModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLovePdfSubmit}
                    variant="brand"
                    className="flex-1"
                    disabled={isSubmitting || isGeocoding}
                  >
                    {isSubmitting ? "Submitting..." : isGeocoding ? "Fetching Coordinates..." : "Generate PDF"}
                  </Button>
                </div>
              </div>
            ) : selectedPsychic ? (
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-semibold text-center">
                  {selectedPsychic.name}'s {selectedPsychic.type} Reading
                </h2>
                <div className="space-y-4">
                  {renderFormFields()}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowReportModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFormSubmit}
                    variant="brand"
                    className="flex-1"
                    disabled={isSubmitting || isGeocoding}
                  >
                    {isSubmitting ? "Submitting..." : isGeocoding ? "Fetching Coordinates..." : "Start Reading"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insufficient Credits</DialogTitle>
            <DialogDescription>
              U heeft {modalType === "loveCompatibility" ? 10 : modalType === "pdfAstrology" || modalType === "lovePdf" ? 15 : 5} credits nodig om uw {modalType === "astrology" ? "astrologische blauwdruk" : modalType === "loveCompatibility" ? "liefdescompatibiliteitsrapport" : modalType === "pdfAstrology" ? "PDF astrologierapport" : modalType === "lovePdf" ? "PDF liefdescompatibiliteitsrapport" : "maandvoorspelling"} te ontgrendelen, maar uw huidige saldo is {userCredits} credits. Voeg alstublieft meer credits toe om verder te gaan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentRedirect}
              variant="brand"
              className="flex-1"
            >
              Add Credits
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {modalType === "astrology" ? "Astrology Report" : "Monthly Forecast"} Unlock
            </DialogTitle>
            <DialogDescription>
              Het ontgrendelen van uw {modalType === "astrology" ? "astrologische blauwdruk" : "maandvoorspelling"} kost 5 credits. Wilt u doorgaan?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnlock}
              variant="brand"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;