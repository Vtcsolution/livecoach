import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  User,
  MessageSquare,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  BarChart3,
  Activity,
  Users,
  TrendingUp,
  Timer
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from 'axios';

const AdminHumanChatDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState(false);
  const [fetchingSessionIds, setFetchingSessionIds] = useState(false);
  const [userDetails, setUserDetails] = useState({}); // Store fetched user details

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totals: {
      psychics: 0,
      sessions: 0,
      paidTimers: 0,
      chatRequests: 0,
      users: 0
    },
    currentStatus: {
      activeSessions: 0,
      activePaidTimers: 0,
      pendingRequests: 0
    },
    financials: {
      totalRevenue: 0,
      totalPaidTime: 0,
      avgSessionValue: 0
    },
    lists: {
      psychics: [],
      recentPaidTimers: [],
      recentSessions: []
    }
  });

  // Store session IDs mapping
  const [sessionIdMap, setSessionIdMap] = useState({});

  useEffect(() => {
    if (admin) {
      fetchDashboardData();
    }
  }, [admin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setFetchingSessionIds(true);

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats`,
        {
          withCredentials: true
        }
      );

      console.log('✅ Dashboard Response:', response.data);

      if (response.data.success) {
        const data = response.data.data || {
          totals: {},
          currentStatus: {},
          financials: {},
          lists: {}
        };
        
        setDashboardData(data);
        
        // Find HumanChatSession IDs for all paid timers
        await findSessionIdsForPaidTimers(data.lists.recentPaidTimers || []);
        
        // Also try to fetch user details for any "Unknown User" entries
        await fetchMissingUserDetails(data.lists.recentPaidTimers || []);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to fetch dashboard data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setFetchingSessionIds(false);
    }
  };

  // Function to fetch user details for missing names
  const fetchMissingUserDetails = async (paidTimers) => {
    const missingUserTimers = paidTimers.filter(
      timer => timer.user === 'Unknown User' || !timer.user || timer.user === 'User (Name Not Available)'
    );
    
    if (missingUserTimers.length === 0) return;
    
    for (const timer of missingUserTimers) {
      try {
        // Try to get chat details which might have proper user info
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${timer._id}`,
          {
            withCredentials: true,
            timeout: 5000
          }
        );
        
        if (response.data.success && response.data.data?.participants?.user) {
          const user = response.data.data.participants.user;
          setUserDetails(prev => ({
            ...prev,
            [timer._id]: user
          }));
        }
      } catch (error) {
        console.error(`❌ Error fetching user details for timer ${timer._id}:`, error.message);
      }
    }
  };

  // Function to find HumanChatSession IDs for paid timers
  const findSessionIdsForPaidTimers = async (paidTimers) => {
    try {
      const newSessionIdMap = {};
      
      for (const timer of paidTimers) {
        if (timer._id) {
          try {
            // Use the backend endpoint that handles redirects
            const response = await axios.get(
              `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${timer._id}`,
              {
                withCredentials: true,
                timeout: 5000
              }
            );

            if (response.data.success) {
              // If we get a redirect response, extract the session ID
              if (response.data.redirect || response.data.sessionId) {
                const sessionId = response.data.sessionId || response.data.redirect.split('/').pop();
                newSessionIdMap[timer._id] = sessionId;
                console.log(`✅ Found session ${sessionId} for timer ${timer._id}`);
              } else {
                // If it's already a session, use the ID directly
                newSessionIdMap[timer._id] = timer._id;
              }
            }
          } catch (error) {
            console.error(`❌ Error finding session for timer ${timer._id}:`, error.message);
            newSessionIdMap[timer._id] = null;
          }
        }
      }
      
      setSessionIdMap(newSessionIdMap);
      console.log('📋 Session ID Map:', newSessionIdMap);
    } catch (error) {
      console.error('❌ Error finding session IDs:', error);
    }
  };

  const handleViewChatDetails = async (itemId, isPaidTimer = false) => {
    try {
      let sessionId = itemId;
      
      // If it's a paid timer, check if we have a mapped session ID
      if (isPaidTimer && sessionIdMap[itemId]) {
        sessionId = sessionIdMap[itemId];
      }
      
      if (!sessionId) {
        // Try to find session ID on the fly
        toast({
          title: "Finding chat session...",
          description: "Please wait while we find the chat session",
          variant: "default"
        });
        
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${itemId}`,
          {
            withCredentials: true,
            timeout: 5000
          }
        );
        
        if (response.data.success && response.data.sessionId) {
          sessionId = response.data.sessionId;
        } else {
          toast({
            title: "No Chat Session",
            description: "No chat session found for this paid timer",
            variant: "destructive"
          });
          return;
        }
      }
      
      // Navigate to chat details with HumanChatSession ID
      console.log(`🚀 Navigating to chat session: ${sessionId}`);
      navigate(`/admin/dashboard/chat-details/${sessionId}`);
      
    } catch (error) {
      console.error('❌ Error viewing chat details:', error);
      toast({
        title: "Error",
        description: "Failed to find chat session",
        variant: "destructive"
      });
    }
  };

  // Helper function to get display name for users - IMPROVED
  const getUserDisplayName = (timer, isPaidTimer = false) => {
    const timerId = timer._id;
    
    // First, check if we have fetched user details for this timer
    if (userDetails[timerId]) {
      const user = userDetails[timerId];
      if (user.name && user.name !== 'Unknown User') return user.name;
      if (user.fullName) return user.fullName;
      if (user.firstName || user.lastName) {
        return `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }
      if (user.email) return user.email.split('@')[0];
    }
    
    // If it's a string (like from backend response)
    if (typeof timer.user === 'string') {
      if (timer.user !== 'Unknown User' && timer.user !== 'User (Name Not Available)') {
        return timer.user;
      }
    }
    
    // If it's an object
    if (timer.user && typeof timer.user === 'object') {
      if (timer.user.name) return timer.user.name;
      if (timer.user.fullName) return timer.user.fullName;
      if (timer.user.firstName || timer.user.lastName) {
        return `${timer.user.firstName || ''} ${timer.user.lastName || ''}`.trim();
      }
      if (timer.user.email) return timer.user.email.split('@')[0];
    }
    
    // For paid timers, try to fetch details on click
    if (isPaidTimer) {
      return 'User (Click to view details)';
    }
    
    // Default fallback
    return 'User (No Name)';
  };

  // Helper function to get display name for psychics
  const getPsychicDisplayName = (item) => {
    // If item is a string (like from backend response)
    if (typeof item === 'string') {
      return item === 'Unknown Psychic' ? 'Psychic (Name Not Available)' : item;
    }
    
    // If item is an object
    if (item && typeof item === 'object') {
      if (item.name) return item.name;
      if (item.email) return item.email.split('@')[0];
    }
    
    // Default fallback
    return 'Psychic (Name Not Available)';
  };

  // Function to fetch user details on demand
  const handleFetchUserDetails = async (timerId, e) => {
    e.stopPropagation(); // Prevent row click
    e.preventDefault();
    
    try {
      toast({
        title: "Fetching user details...",
        description: "Please wait",
        variant: "default"
      });
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/${timerId}`,
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.data?.participants?.user) {
        const user = response.data.data.participants.user;
        setUserDetails(prev => ({
          ...prev,
          [timerId]: user
        }));
        
        toast({
          title: "User details updated",
          description: `Found user: ${user.name || user.email || 'User'}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return `Today, ${date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatAmount = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-muted-foreground">Loading admin data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
     
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
       
        <main className="flex-1 p-6 ml-0 mt-20 lg:ml-64 transition-all duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Chat Management Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Overview of all chat sessions, requests, and paid timers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Psychics</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.totals.psychics || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.totals.sessions || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Paid Timers</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.totals.paidTimers || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Timer className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chat Requests</p>
                    <p className="text-2xl font-bold mt-1">{dashboardData.totals.chatRequests || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
           
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold mt-1">
                      ${(dashboardData.financials.totalRevenue || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different lists */}
          <Tabs defaultValue="recent-sessions" className="mb-6">
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger value="recent-sessions">Recent Sessions</TabsTrigger>
              <TabsTrigger value="recent-paid">Recent Paid Timers</TabsTrigger>
              <TabsTrigger value="recent-psychics">Recent Psychics</TabsTrigger>
            </TabsList>

            {/* Recent Sessions Tab - Already uses HumanChatSession IDs */}
            <TabsContent value="recent-sessions">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Chat Sessions</CardTitle>
                  <CardDescription>
                    Latest chat sessions with HumanChatSession IDs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>User</TableHead>
                          <TableHead>Psychic</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Last Activity</TableHead>
                          <TableHead>Chat Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <span className="text-muted-foreground">Loading sessions...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : dashboardData.lists.recentSessions?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-3">
                                <MessageSquare className="h-12 w-12 text-gray-300" />
                                <p className="font-medium">No recent sessions</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          dashboardData.lists.recentSessions?.map((session, index) => (
                            <TableRow key={session._id || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {getUserDisplayName(session, false)}
                                    </p>
                                    {typeof session.user === 'object' && session.user?.email && (
                                      <p className="text-xs text-muted-foreground">
                                        {session.user.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {getPsychicDisplayName(session.psychic)}
                                    </p>
                                    {typeof session.psychic === 'object' && session.psychic?.email && (
                                      <p className="text-xs text-muted-foreground">
                                        {session.psychic.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  session.status === 'active' 
                                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                                    : session.status === 'ended'
                                    ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                    : "bg-gray-500/10 text-gray-700 border-gray-500/20"
                                }>
                                  {session.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{formatDuration(session.duration)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(session.lastMessageAt)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleViewChatDetails(session._id, false)}
                                  disabled={loading}
                                >
                                  View Chat
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Paid Timers Tab - Needs to find HumanChatSession IDs */}
            <TabsContent value="recent-paid">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Paid Timer Sessions</CardTitle>
                  <CardDescription>
                    {fetchingSessionIds ? "Finding chat sessions..." : "Latest completed paid timer sessions"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>User</TableHead>
                          <TableHead>Psychic</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Ended At</TableHead>
                          <TableHead>Chat Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <span className="text-muted-foreground">Loading paid timers...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : dashboardData.lists.recentPaidTimers?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-3">
                                <Timer className="h-12 w-12 text-gray-300" />
                                <p className="font-medium">No recent paid timers</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          dashboardData.lists.recentPaidTimers?.map((timer, index) => {
                            const hasSession = !!sessionIdMap[timer._id];
                            
                            return (
                              <TableRow 
                                key={timer._id || index}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleViewChatDetails(timer._id, true)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                      <User className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {getUserDisplayName(timer, true)}
                                      </p>
                                      {userDetails[timer._id]?.email && (
                                        <p className="text-xs text-muted-foreground">
                                          {userDetails[timer._id].email}
                                        </p>
                                      )}
                                      {timer.user === 'Unknown User' && !userDetails[timer._id] && (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="h-4 p-0 text-xs text-blue-600"
                                          onClick={(e) => handleFetchUserDetails(timer._id, e)}
                                        >
                                          Try to find user
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                      <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {getPsychicDisplayName(timer.psychic)}
                                      </p>
                                      {typeof timer.psychic === 'object' && timer.psychic?.email && (
                                        <p className="text-xs text-muted-foreground">
                                          {timer.psychic.email}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-yellow-600" />
                                    <span className="font-medium">{formatAmount(timer.amount)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Timer className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm">{formatDuration(timer.duration)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(timer.endedAt)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant={hasSession ? "default" : "outline"}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewChatDetails(timer._id, true);
                                    }}
                                    disabled={!hasSession || loading}
                                    title={hasSession ? "View chat session" : "No chat session found"}
                                  >
                                    {hasSession ? "View Chat" : "No Chat"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Psychics Tab */}
            <TabsContent value="recent-psychics">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Psychics</CardTitle>
                  <CardDescription>
                    Recently registered psychics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rate/Min</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <span className="text-muted-foreground">Loading psychics...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : dashboardData.lists.psychics?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-3">
                                <Users className="h-12 w-12 text-gray-300" />
                                <p className="font-medium">No psychics found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          dashboardData.lists.psychics?.map((psychic, index) => (
                            <TableRow key={psychic._id || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {getPsychicDisplayName(psychic)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{psychic.email}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-yellow-600" />
                                  <span className="font-medium">${(psychic.ratePerMin || 0).toFixed(2)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">
                                    {psychic.averageRating ? psychic.averageRating.toFixed(1) : '0.0'}/5
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ({psychic.totalRatings || 0})
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(psychic.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  psychic.isVerified
                                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                                    : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                }>
                                  {psychic.isVerified ? 'Verified' : 'Pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminHumanChatDashboard;