import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  MessageSquare,
  Clock,
  Star,
  Calendar,
  TrendingUp,
  BarChart3,
  User,
  Mail,
  Phone,
  MapPin,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from 'axios';

const AdminPsychicsDataById = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [side, setSide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [psychicDetails, setPsychicDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchPsychicDetails();
    }
  }, [id]);

  const fetchPsychicDetails = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics/${id}`,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPsychicDetails(response.data.data);
        
        toast({
          title: "Success",
          description: `Loaded details for ${response.data.data.profile.name}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to load psychic details",
          variant: "destructive"
        });
        navigate('/admin/dashboard/humancoach');
      }
    } catch (error) {
      console.error('❌ Fetch psychic details error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load psychic details",
        variant: "destructive"
      });
      navigate('/admin/dashboard/humancoach');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "N/A";
    }
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Format duration from seconds
  const formatDurationSeconds = (seconds) => {
    if (!seconds || seconds === 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Back to list view
  const handleBackToList = () => {
    navigate('/admin/dashboard/humancoach');
  };

  // View chat session
  const handleViewChat = (sessionId) => {
    navigate(`/admin/dashboard/chat-details/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 p-6 ml-0 lg:ml-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">Loading psychic details...</span>
          </main>
        </div>
      </div>
    );
  }

  if (!psychicDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 p-6 ml-0 lg:ml-64 flex flex-col items-center justify-center">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Psychic Not Found</h2>
              <p className="text-muted-foreground mb-4">
                No psychic found with ID: {id?.substring(0, 12)}...
              </p>
              <Button onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Psychics
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { profile, statistics, financials, recentActivity, userInteractions, timeline } = psychicDetails;

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 p-6 ml-0 lg:ml-64 transition-all duration-300">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Psychics
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {profile.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={
                    profile.isVerified 
                      ? "bg-green-500/10 text-green-700 border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                  }>
                    {profile.isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                  <Badge variant="outline">
                    {profile.status || 'Active'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Joined: {formatDate(profile.joinDate)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPsychicDetails} 
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Profile Info */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-24 w-24 mb-4">
                    {profile.image ? (
                      <AvatarImage src={profile.image} />
                    ) : (
                      <AvatarFallback className="text-2xl bg-purple-100 text-purple-600">
                        {profile.name?.[0]?.toUpperCase() || 'P'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">
                      {profile.averageRating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({profile.totalRatings || 0} ratings)
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rate per minute:</span>
                    <span className="font-medium">
                      {formatCurrency(profile.ratePerMin)}/min
                    </span>
                  </div>
                  
                  {profile.gender && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Gender:</span>
                      <span className="font-medium">{profile.gender}</span>
                    </div>
                  )}
                  
                  {profile.type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <span className="font-medium">{profile.type}</span>
                    </div>
                  )}
                  
                  {profile.abilities?.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">Abilities:</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.abilities.map((ability, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {ability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile.bio && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">Bio:</span>
                      <p className="text-sm">{profile.bio}</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Last Active:</span>
                      <span className="text-sm font-medium">
                        {formatDate(timeline.lastActive)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Online Time:</span>
                      <span className="text-sm font-medium">
                        {timeline.totalOnlineTime} hours
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                        <p className="text-2xl font-bold mt-1">
                          {formatCurrency(statistics.totals.earnings)}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                        <p className="text-2xl font-bold mt-1">
                          {statistics.totals.sessions}
                        </p>
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
                        <p className="text-sm font-medium text-muted-foreground">Hours Worked</p>
                        <p className="text-2xl font-bold mt-1">
                          {statistics.totals.hoursWorked}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Session Value</p>
                        <p className="text-2xl font-bold mt-1">
                          {formatCurrency(statistics.performance.avgEarningsPerSession)}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Earnings/Hour</p>
                        <p className="text-2xl font-bold mt-1">
                          {formatCurrency(statistics.performance.earningsPerHour)}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold mt-1">
                          {statistics.performance.completionRate}%
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Active Chats</p>
                        <p className="text-xl font-bold">{statistics.current.activeChats}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Avg Session Duration</p>
                        <p className="text-xl font-bold">
                          {statistics.current.avgSessionDuration}m
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pending Requests</p>
                        <p className="text-xl font-bold">
                          {statistics.current.pendingRequests}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Tabs for detailed information */}
          <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="users">Top Users</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>
                    Key metrics and performance indicators for {profile.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-4">Session Statistics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Sessions:</span>
                          <span className="font-medium">{statistics.totals.sessions}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Paid Timers:</span>
                          <span className="font-medium">{statistics.totals.paidTimers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Average Session Duration:</span>
                          <span className="font-medium">{statistics.current.avgSessionDuration}m</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Completion Rate:</span>
                          <span className="font-medium">{statistics.performance.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-4">Financial Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Earnings:</span>
                          <span className="font-medium">{formatCurrency(statistics.totals.earnings)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Hours Worked:</span>
                          <span className="font-medium">{statistics.totals.hoursWorked}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Average per Session:</span>
                          <span className="font-medium">{formatCurrency(statistics.performance.avgEarningsPerSession)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Earnings per Hour:</span>
                          <span className="font-medium">{formatCurrency(statistics.performance.earningsPerHour)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                 
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest chat sessions and paid timers for {profile.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="chats" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full max-w-xs mb-4">
                      <TabsTrigger value="chats">Chat Sessions</TabsTrigger>
                      <TabsTrigger value="paid-timers">Paid Timers</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="chats">
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>User</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Last Activity</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentActivity.chatSessions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                  <p>No recent chat sessions</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              recentActivity.chatSessions.map((session, index) => (
                                <TableRow key={session._id || index}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                          {session.user?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm">{session.user || 'Unknown User'}</p>
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
                                    {session._id && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewChat(session._id)}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="paid-timers">
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>User</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Ended At</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentActivity.paidTimers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                  <p>No recent paid timers</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              recentActivity.paidTimers.map((timer, index) => (
                                <TableRow key={timer._id || index}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-green-100 text-green-600">
                                          {timer.user?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm">{timer.user || 'Unknown User'}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-4 w-4 text-yellow-600" />
                                      <span className="font-medium">{formatCurrency(timer.amount)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-orange-600" />
                                      <span className="text-sm">{formatDuration(timer.duration)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={
                                      timer.isActive
                                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                                        : timer.status === 'completed'
                                        ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                        : "bg-gray-500/10 text-gray-700 border-gray-500/20"
                                    }>
                                      {timer.isActive ? 'Active' : timer.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {formatDate(timer.endedAt)}
                                  </TableCell>
                                  <TableCell>
                                    {timer._id && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewChat(timer._id)}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Breakdown</CardTitle>
                  <CardDescription>
                    Financial performance and earnings history for {profile.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Monthly Earnings Table */}
                  {financials.monthlyBreakdown.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No earnings data available</p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border overflow-hidden mb-6">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Month</TableHead>
                              <TableHead>Earnings</TableHead>
                              <TableHead>Sessions</TableHead>
                              <TableHead>Total Minutes</TableHead>
                              <TableHead>Avg per Session</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {financials.monthlyBreakdown.map((month, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{month.period}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">{formatCurrency(month.totalEarnings)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{month.sessionCount}</TableCell>
                                <TableCell>{Math.round(month.totalMinutes)}</TableCell>
                                <TableCell>
                                  {formatCurrency(month.totalEarnings / month.sessionCount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Financial Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-center">
                              <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                              <p className="text-2xl font-bold mt-1 text-green-600">
                                {formatCurrency(financials.totalEarnings)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-center">
                              <p className="text-sm font-medium text-muted-foreground">Avg Monthly Earnings</p>
                              <p className="text-2xl font-bold mt-1 text-blue-600">
                                {formatCurrency(financials.avgEarningsPerMonth)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-center">
                              <p className="text-sm font-medium text-muted-foreground">Estimated Monthly</p>
                              <p className="text-2xl font-bold mt-1 text-purple-600">
                                {formatCurrency(financials.estimatedMonthlyEarnings)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                  
                  {/* Rate Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Rate Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Rate</p>
                          <p className="text-xl font-bold">{formatCurrency(profile.ratePerMin)}/min</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Potential Monthly (Est.)</p>
                          <p className="text-xl font-bold">{formatCurrency(profile.ratePerMin * 40 * 20 * 4)}</p>
                          <p className="text-xs text-muted-foreground">Based on 40min/session × 20sessions/week × 4weeks</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Top Users</CardTitle>
                  <CardDescription>
                    Users with the most interactions with {profile.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userInteractions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No user interaction data available</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>User</TableHead>
                            <TableHead>Total Sessions</TableHead>
                            <TableHead>Total Spent</TableHead>
                            <TableHead>Avg per Session</TableHead>
                            <TableHead>Last Session</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userInteractions.map((user, index) => (
                            <TableRow key={user.userId || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-purple-100 text-purple-600">
                                      {user.userName?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{user.userName || 'Unknown User'}</p>
                                    <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.totalSessions}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">{formatCurrency(user.totalSpent)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatCurrency(user.totalSpent / user.totalSessions)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(user.lastSession)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Created</p>
                    <p className="font-medium">{formatDate(profile.createdAt)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(profile.updatedAt)}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verification Status</p>
                    <p className="font-medium">{profile.isVerified ? 'Verified' : 'Pending'}</p>
                  </div>
                  {profile.isVerified ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-yellow-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPsychicsDataById;