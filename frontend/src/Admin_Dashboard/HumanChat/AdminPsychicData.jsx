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

const AdminPsychicsData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams(); // For psychic details view
  const [side, setSide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // State for psychics list
  const [psychics, setPsychics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for psychic details (when viewing specific psychic)
  const [psychicDetails, setPsychicDetails] = useState(null);
  
  // Check if we're in details view
  const isDetailsView = !!id;

  useEffect(() => {
    if (isDetailsView) {
      fetchPsychicDetails();
    } else {
      fetchPsychics();
    }
  }, [id, currentPage, limit, filterStatus]);

  // Fetch all psychics with pagination
  const fetchPsychics = async () => {
    try {
      setLoading(true);
      
      let url = `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics?page=${currentPage}&limit=${limit}`;
      
      // Add filters if specified
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }

      const response = await axios.get(url, {
        withCredentials: true
      });

      if (response.data.success) {
        setPsychics(response.data.data.psychics);
        setTotalPages(response.data.data.pagination.pages);
        
        toast({
          title: "Success",
          description: `Loaded ${response.data.data.psychics.length} psychics`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ Fetch psychics error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load psychics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific psychic details
  const fetchPsychicDetails = async () => {
    try {
      setLoadingDetails(true);
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/admindata/chats/psychics/${id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setPsychicDetails(response.data.data);
        
        toast({
          title: "Success",
          description: `Loaded details for ${response.data.data.profile.name}`,
          variant: "default"
        });
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
      setLoadingDetails(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
        year: 'numeric'
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

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPsychics();
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  // View psychic details
  const handleViewPsychic = (psychicId) => {
    navigate(`/admin/dashboard/psychics/${psychicId}`);
  };

  // Back to list view
  const handleBackToList = () => {
    navigate('/admin/dashboard/humancoach');
  };

  // View chat session
  const handleViewChat = (sessionId) => {
    navigate(`/admin/dashboard/chat-details/${sessionId}`);
  };

  if (loading && !isDetailsView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 mt-20 p-6 ml-0 lg:ml-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">Loading psychics...</span>
          </main>
        </div>
      </div>
    );
  }

  if (loadingDetails && isDetailsView) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 p-6 ml-0 lg:ml-64 transition-all duration-300">
          
          {isDetailsView ? (
            // Psychic Details View
            psychicDetails ? (
              <>
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
                        {psychicDetails.profile.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={
                          psychicDetails.profile.isVerified 
                            ? "bg-green-500/10 text-green-700 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                        }>
                          {psychicDetails.profile.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                        <Badge variant="outline">
                          {psychicDetails.profile.status || 'Active'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Joined: {formatDate(psychicDetails.profile.joinDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchPsychicDetails} 
                      disabled={loadingDetails}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingDetails ? 'animate-spin' : ''}`} />
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
                          {psychicDetails.profile.image ? (
                            <AvatarImage src={psychicDetails.profile.image} />
                          ) : (
                            <AvatarFallback className="text-2xl bg-purple-100 text-purple-600">
                              {psychicDetails.profile.name?.[0]?.toUpperCase() || 'P'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <h2 className="text-xl font-bold">{psychicDetails.profile.name}</h2>
                        <p className="text-muted-foreground">{psychicDetails.profile.email}</p>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">
                            {psychicDetails.profile.averageRating?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({psychicDetails.profile.totalRatings || 0} ratings)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Rate per minute:</span>
                          <span className="font-medium">
                            {formatCurrency(psychicDetails.profile.ratePerMin)}/min
                          </span>
                        </div>
                        
                        {psychicDetails.profile.gender && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Gender:</span>
                            <span className="font-medium">{psychicDetails.profile.gender}</span>
                          </div>
                        )}
                        
                        {psychicDetails.profile.type && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Type:</span>
                            <span className="font-medium">{psychicDetails.profile.type}</span>
                          </div>
                        )}
                        
                        {psychicDetails.profile.abilities?.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground block mb-2">Abilities:</span>
                            <div className="flex flex-wrap gap-1">
                              {psychicDetails.profile.abilities.map((ability, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {ability}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {psychicDetails.profile.bio && (
                          <div>
                            <span className="text-sm text-muted-foreground block mb-2">Bio:</span>
                            <p className="text-sm">{psychicDetails.profile.bio}</p>
                          </div>
                        )}
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
                                {formatCurrency(psychicDetails.statistics.totals.earnings)}
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
                                {psychicDetails.statistics.totals.sessions}
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
                                {psychicDetails.statistics.totals.hoursWorked}
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
                                {formatCurrency(psychicDetails.statistics.performance.avgEarningsPerSession)}
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
                                {formatCurrency(psychicDetails.statistics.performance.earningsPerHour)}
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
                                {psychicDetails.statistics.performance.completionRate}%
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
                              <p className="text-xl font-bold">{psychicDetails.statistics.current.activeChats}</p>
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
                                {psychicDetails.statistics.current.avgSessionDuration}m
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
                                {psychicDetails.statistics.current.pendingRequests}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Tabs for detailed information */}
                <Tabs defaultValue="recent-activity" className="mb-6">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
                    <TabsTrigger value="monthly-earnings">Monthly Earnings</TabsTrigger>
                    <TabsTrigger value="user-interactions">Top Users</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  {/* Recent Activity Tab */}
                  <TabsContent value="recent-activity">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                          Latest chat sessions and paid timers
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
                                  {psychicDetails.recentActivity.chatSessions.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                        <p>No recent chat sessions</p>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    psychicDetails.recentActivity.chatSessions.map((session, index) => (
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
                                  {psychicDetails.recentActivity.paidTimers.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                        <p>No recent paid timers</p>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    psychicDetails.recentActivity.paidTimers.map((timer, index) => (
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

                  {/* Monthly Earnings Tab */}
                  <TabsContent value="monthly-earnings">
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Earnings Breakdown</CardTitle>
                        <CardDescription>
                          Earnings distribution over the last 6 months
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {psychicDetails.financials.monthlyBreakdown.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No earnings data available</p>
                          </div>
                        ) : (
                          <div className="rounded-md border overflow-hidden">
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
                                {psychicDetails.financials.monthlyBreakdown.map((month, index) => (
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
                        )}
                        
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h3 className="font-medium text-blue-800 mb-2">Financial Summary</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-blue-600">Total Earnings</p>
                              <p className="text-xl font-bold text-blue-800">
                                {formatCurrency(psychicDetails.financials.totalEarnings)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-blue-600">Average Monthly Earnings</p>
                              <p className="text-xl font-bold text-blue-800">
                                {formatCurrency(psychicDetails.financials.avgEarningsPerMonth)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-blue-600">Estimated Monthly Potential</p>
                              <p className="text-xl font-bold text-blue-800">
                                {formatCurrency(psychicDetails.financials.estimatedMonthlyEarnings)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* User Interactions Tab */}
                  <TabsContent value="user-interactions">
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Users</CardTitle>
                        <CardDescription>
                          Users with the most interactions with this psychic
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {psychicDetails.userInteractions.length === 0 ? (
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
                                {psychicDetails.userInteractions.map((user, index) => (
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

                  {/* Reviews Tab */}
                  <TabsContent value="reviews">
                    <Card>
                      <CardHeader>
                        <CardTitle>Reviews & Ratings</CardTitle>
                        <CardDescription>
                          Recent reviews from users
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {psychicDetails.recentActivity.recentReviews.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No reviews yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {psychicDetails.recentActivity.recentReviews.map((review, index) => (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-yellow-100 text-yellow-600">
                                          U
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm">{review.userName || 'Anonymous User'}</p>
                                        <div className="flex items-center gap-1">
                                          {[...Array(5)].map((_, i) => (
                                            <Star 
                                              key={i} 
                                              className={`h-3 w-3 ${i < (review.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(review.createdAt)}
                                    </span>
                                  </div>
                                  {review.comment && (
                                    <p className="text-sm mt-2">{review.comment}</p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                        
                        {/* Rating Summary */}
                        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h3 className="font-medium text-yellow-800 mb-2">Rating Summary</h3>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-yellow-800">
                                {psychicDetails.profile.averageRating?.toFixed(1) || '0.0'}
                              </p>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < Math.floor(psychicDetails.profile.averageRating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-yellow-600">Based on</p>
                              <p className="text-xl font-bold text-yellow-800">
                                {psychicDetails.profile.totalRatings || 0} ratings
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : null
          ) : (
            // Psychics List View
            <>
              {/* Header */}
              <div className="flex f mt-20 lex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Psychics Management
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Overview of all registered psychics and their performance
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={fetchPsychics} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Filters and Search */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Button type="submit" disabled={loading}>
                          Search
                        </Button>
                      </form>
                    </div>
                    
                    <div>
                      <Select value={filterStatus} onValueChange={handleFilterChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="pending">Pending Verification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Items per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="20">20 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                          <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              {psychics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Psychics</p>
                          <p className="text-2xl font-bold mt-1">{psychics.length}</p>
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
                          <p className="text-sm font-medium text-muted-foreground">Verified Psychics</p>
                          <p className="text-2xl font-bold mt-1">
                            {psychics.filter(p => p.isVerified).length}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                          <p className="text-2xl font-bold mt-1">
                            {formatCurrency(psychics.reduce((sum, p) => sum + (p.statistics?.totalEarnings || 0), 0))}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                          <p className="text-2xl font-bold mt-1">
                            {(psychics.reduce((sum, p) => sum + (p.averageRating || 0), 0) / psychics.length).toFixed(1)}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Star className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Psychics Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Psychics List</CardTitle>
                  <CardDescription>
                    Showing {psychics.length} of {totalPages * limit} psychics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {psychics.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="font-medium">No psychics found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Psychic</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Rate/Min</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Earnings</TableHead>
                            <TableHead>Sessions</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {psychics.map((psychic) => (
                            <TableRow key={psychic._id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    {psychic.image ? (
                                      <AvatarImage src={psychic.image} />
                                    ) : (
                                      <AvatarFallback className="bg-purple-100 text-purple-600">
                                        {psychic.name?.[0]?.toUpperCase() || 'P'}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{psychic.name}</p>
                                    <p className="text-sm text-muted-foreground">{psychic.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge className={
                                    psychic.isVerified 
                                      ? "bg-green-500/10 text-green-700 border-green-500/20"
                                      : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                  }>
                                    {psychic.isVerified ? 'Verified' : 'Pending'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {psychic.status || 'Active'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-yellow-600" />
                                  <span className="font-medium">
                                    ${(psychic.ratePerMin || 0).toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="font-medium">
                                    {psychic.averageRating ? psychic.averageRating.toFixed(1) : '0.0'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ({psychic.totalRatings || 0})
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">
                                    {formatCurrency(psychic.statistics?.totalEarnings || 0)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  ${(psychic.statistics?.earningsPerHour || 0).toFixed(2)}/hour
                                </p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{psychic.statistics?.totalSessions || 0}</span>
                                  {psychic.statistics?.activeSessions > 0 && (
                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                                      {psychic.statistics.activeSessions} active
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(psychic.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                 <Button
  variant="default"
  size="sm"
  onClick={() => navigate(`/admin/dashboard/psychics/${psychic._id}`)}
>
  <Eye className="h-4 w-4 mr-1" />
  View Details
</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              disabled={loading}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPsychicsData;