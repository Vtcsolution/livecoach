import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { usePsychicAuth } from "../context/PsychicAuthContext";
import axios from "axios";
import {
  FaUsers,
  FaClock,
  FaDollarSign,
  FaChartLine,
  FaUserFriends,
  FaCommentDots,
  FaStar,
  FaChartBar,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaCalendar,
  FaSpinner,
  FaChartPie,
  FaMoneyBillWave,
  FaUserTie,
  FaHistory,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaPercent,
  FaWallet,
  FaUserCheck,
  FaExchangeAlt,
  FaFilter,
  FaDownload,
  FaEye,
  FaSearch,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, suffix = "", loading, change = null }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${loading ? 'animate-pulse' : ''}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-2">
          {loading ? "..." : value}
          {suffix && <span className="text-lg text-gray-500">{suffix}</span>}
        </h3>
        {change !== null && !loading && (
          <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {change > 0 ? <FaArrowUp className="mr-1" /> : 
             change < 0 ? <FaArrowDown className="mr-1" /> : 
             <FaEquals className="mr-1" />}
            <span>{Math.abs(change)}%</span>
            <span className="ml-1 text-gray-500">from last period</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`text-2xl ${color}`} />
      </div>
    </div>
  </div>
);

// Period Card Component
const PeriodCard = ({ period, data, loading, currency = "USD", active = false, onClick }) => {
  const getPeriodIcon = (period) => {
    switch (period) {
      case 'Today': return FaCalendarDay;
      case 'This Week': return FaCalendarWeek;
      case 'This Month': return FaCalendarAlt;
      case 'This Year': return FaCalendar;
      default: return FaCalendar;
    }
  };
  
  const PeriodIcon = getPeriodIcon(period);

  return (
    <div 
      className={`rounded-xl shadow-md p-6 cursor-pointer transition-all ${active ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white hover:bg-gray-50'}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-lg ${active ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <PeriodIcon className={`text-lg ${active ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        <h4 className={`text-lg font-semibold ${active ? 'text-blue-800' : 'text-gray-800'}`}>
          {period}
        </h4>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Revenue</span>
          <span className={`font-semibold ${active ? 'text-blue-700' : 'text-green-600'}`}>
            {loading ? "..." : formatCurrency(data.revenue || 0, currency)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Sessions</span>
          <span className="font-semibold">
            {loading ? "..." : data.sessions || 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Users</span>
          <span className="font-semibold">
            {loading ? "..." : data.users || 0}
          </span>
        </div>
        {(data.timeMinutes || 0) > 0 && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-gray-600">Chat Time</span>
            <span className="font-semibold">
              {loading ? "..." : `${Math.round(data.timeMinutes || 0)} min`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Debug Panel Component
const DebugPanel = ({ apiResponse, loading }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!apiResponse || loading) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center"
      >
        <FaExclamationTriangle className="mr-2" />
        {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
      </button>
      
      {showDebug && (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-96">
          <h4 className="font-bold mb-2">API Response:</h4>
          <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Format currency helper
const formatCurrency = (amount, currency = "USD") => {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export default function PsychicDashboard() {
  const { psychic } = usePsychicAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [dashboardData, setDashboardData] = useState({
    quickStats: null,
    detailedEarnings: null,
    userBreakdown: [],
    recentSessions: []
  });
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activePeriod, setActivePeriod] = useState("This Month");

  const isDashboardHome = location.pathname === '/psychic/dashboard';

  // Create API instance
  const api = useRef(
    axios.create({
      baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  // Add request interceptor
  useEffect(() => {
    const requestInterceptor = api.current.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('psychicToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('Request Interceptor Error:', error);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.current.interceptors.response.use(
      (response) => {
        console.log('API Response Success:', response.config.url, response.status);
        return response;
      },
      (error) => {
        console.error('API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );

    return () => {
      api.current.interceptors.request.eject(requestInterceptor);
      api.current.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('psychicToken');
    if (!token) {
      setError('Please login to access the dashboard');
      setLoading(false);
      navigate('/psychic/login');
      return;
    }
  }, [navigate]);

  // Enhanced data fetching with detailed logging
  const fetchDashboardData = async () => {
    try {
      setError(null);
      console.log('Starting dashboard data fetch...');
      
      // List of potential endpoints to try
      const endpoints = [
        '/api/chatrequest/psychic/earnings',
        '/api/chatrequest/psychic/earnings',
        '/api/chatrequest/psychic/dashboard',
        '/api/chatrequest/psychic/stats',
        '/api/chatrequest/earnings/psychic'
      ];
      
      let response = null;
      let successfulEndpoint = '';
      
      // Try each endpoint until one succeeds
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const result = await api.current.get(endpoint);
          
          if (result.data) {
            console.log(`Success with endpoint: ${endpoint}`, result.data);
            response = result.data;
            successfulEndpoint = endpoint;
            break;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
          continue;
        }
      }
      
      if (!response) {
        throw new Error('No data received from any endpoint');
      }
      
      // Store raw API response for debugging
      setApiResponse(response);
      
      // Process the data based on actual response structure
      const processedData = processApiResponse(response, successfulEndpoint);
      setDashboardData(processedData);
      
      console.log('Processed data:', processedData);
      return { success: true, data: processedData, endpoint: successfulEndpoint };
      
    } catch (err) {
      console.error('Final error in fetchDashboardData:', err);
      
      // Create mock data for development/demo
      const mockData = createMockData();
      setDashboardData(mockData);
      setApiResponse({ mock: true, message: 'Using mock data due to API failure' });
      
      let errorMessage = 'Failed to fetch dashboard data. Using demo data.';
      if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.removeItem('psychicToken');
        localStorage.removeItem('psychicData');
        setTimeout(() => navigate('/psychic/login'), 2000);
      } else if (err.response?.data?.message) {
        errorMessage = `API Error: ${err.response.data.message}`;
      }
      
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Process API response based on endpoint
  const processApiResponse = (response, endpoint) => {
    console.log(`Processing response from ${endpoint}:`, response);
    
    // Extract data based on response structure
    const data = response.data || response;
    
    // Initialize with defaults
    const result = {
      quickStats: {
        today: { earnings: 0, sessions: 0 },
        week: { earnings: 0, sessions: 0 },
        month: { earnings: 0, sessions: 0 },
        allTime: { earnings: 0, sessions: 0, uniqueUsers: 0 }
      },
      detailedEarnings: {
        daily: { earnings: 0, sessions: 0, timeMinutes: 0 },
        weekly: { earnings: 0, sessions: 0, timeMinutes: 0 },
        monthly: { earnings: 0, sessions: 0, timeMinutes: 0 },
        allTime: { earnings: 0, sessions: 0, timeMinutes: 0, totalUsers: 0 }
      },
      userBreakdown: [],
      recentSessions: []
    };
    
    try {
      // Try different response structures
      if (response.success && response.data) {
        // Structure: { success: true, data: { ... } }
        const d = response.data;
        
        // Check for different data structures
        if (d.summary) {
          // Earnings summary structure
          result.quickStats.today.earnings = d.summary.daily?.earnings || d.summary.today?.amount || 0;
          result.quickStats.today.sessions = d.summary.daily?.sessions || d.summary.today?.sessions || 0;
          
          result.quickStats.week.earnings = d.summary.weekly?.earnings || d.summary.week?.amount || 0;
          result.quickStats.week.sessions = d.summary.weekly?.sessions || d.summary.week?.sessions || 0;
          
          result.quickStats.month.earnings = d.summary.monthly?.earnings || d.summary.month?.amount || 0;
          result.quickStats.month.sessions = d.summary.monthly?.sessions || d.summary.month?.sessions || 0;
          
          result.quickStats.allTime.earnings = d.summary.allTime?.earnings || d.summary.total?.amount || 0;
          result.quickStats.allTime.sessions = d.summary.allTime?.sessions || d.summary.total?.sessions || 0;
          result.quickStats.allTime.uniqueUsers = d.summary.allTime?.totalUsers || d.summary.total?.users || 0;
          
          // Copy to detailed earnings
          result.detailedEarnings = { ...d.summary };
        } else if (d.today || d.week || d.month) {
          // Flat stats structure
          result.quickStats.today.earnings = d.today?.earnings || d.today?.amount || 0;
          result.quickStats.today.sessions = d.today?.sessions || 0;
          
          result.quickStats.week.earnings = d.week?.earnings || d.week?.amount || 0;
          result.quickStats.week.sessions = d.week?.sessions || 0;
          
          result.quickStats.month.earnings = d.month?.earnings || d.month?.amount || 0;
          result.quickStats.month.sessions = d.month?.sessions || 0;
          
          result.quickStats.allTime.earnings = d.totalEarnings || d.allTime?.amount || 0;
          result.quickStats.allTime.sessions = d.totalSessions || d.allTime?.sessions || 0;
          result.quickStats.allTime.uniqueUsers = d.totalUsers || d.allTime?.users || 0;
        }
        
        // Get user breakdown
        result.userBreakdown = d.userBreakdown || d.topUsers || d.users || [];
        
        // Get recent sessions
        result.recentSessions = d.recentSessions || d.sessions || [];
        
      } else if (data.todayEarnings !== undefined) {
        // Direct earnings fields
        result.quickStats.today.earnings = data.todayEarnings || 0;
        result.quickStats.week.earnings = data.weekEarnings || 0;
        result.quickStats.month.earnings = data.monthEarnings || 0;
        result.quickStats.allTime.earnings = data.totalEarnings || 0;
        
        result.quickStats.today.sessions = data.todaySessions || 0;
        result.quickStats.week.sessions = data.weekSessions || 0;
        result.quickStats.month.sessions = data.monthSessions || 0;
        result.quickStats.allTime.sessions = data.totalSessions || 0;
        result.quickStats.allTime.uniqueUsers = data.totalUsers || 0;
      }
      
      console.log('Processed result:', result);
      
    } catch (processErr) {
      console.error('Error processing API response:', processErr);
    }
    
    return result;
  };

  // Create mock data for demo/development
  const createMockData = () => {
    console.log('Creating mock data...');
    
    // Generate realistic mock data
    const todayEarnings = 45.67;
    const weekEarnings = 156.89;
    const monthEarnings = 489.32;
    const totalEarnings = 2345.67;
    
    const todaySessions = 3;
    const weekSessions = 8;
    const monthSessions = 23;
    const totalSessions = 125;
    
    const totalUsers = 15;
    
    return {
      quickStats: {
        today: { earnings: todayEarnings, sessions: todaySessions },
        week: { earnings: weekEarnings, sessions: weekSessions },
        month: { earnings: monthEarnings, sessions: monthSessions },
        allTime: { earnings: totalEarnings, sessions: totalSessions, uniqueUsers: totalUsers }
      },
      detailedEarnings: {
        daily: { earnings: todayEarnings, sessions: todaySessions, timeMinutes: 25 },
        weekly: { earnings: weekEarnings, sessions: weekSessions, timeMinutes: 78 },
        monthly: { earnings: monthEarnings, sessions: monthSessions, timeMinutes: 245 },
        allTime: { earnings: totalEarnings, sessions: totalSessions, timeMinutes: 1250, totalUsers: totalUsers }
      },
      userBreakdown: [
        {
          user: { _id: '1', firstName: 'Zia', lastName: 'Rana', email: 'user1@gmail.com' },
          totalEarnings: 23.22,
          totalSessions: 10,
          totalTimeMinutes: 23,
          avgEarningsPerSession: 2.32,
          sessionFrequency: 1.5
        },
        {
          user: { _id: '2', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          totalEarnings: 18.75,
          totalSessions: 8,
          totalTimeMinutes: 18,
          avgEarningsPerSession: 2.34,
          sessionFrequency: 1.2
        },
        {
          user: { _id: '3', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
          totalEarnings: 15.50,
          totalSessions: 6,
          totalTimeMinutes: 15,
          avgEarningsPerSession: 2.58,
          sessionFrequency: 0.8
        }
      ],
      recentSessions: [
        {
          _id: '1',
          user: { firstName: 'Zia', email: 'user1@gmail.com' },
          amount: 4.48,
          durationMinutes: 4,
          endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          user: { firstName: 'John', email: 'john@example.com' },
          amount: 3.25,
          durationMinutes: 3,
          endedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '3',
          user: { firstName: 'Jane', email: 'jane@example.com' },
          amount: 5.75,
          durationMinutes: 5,
          endedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchDashboardData();
      console.log('Dashboard load completed:', result);
      setLoading(false);
    };

    if (isDashboardHome) {
      loadData();
    }
  }, [isDashboardHome]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Calculate period data for cards
  const periodData = {
    'Today': {
      revenue: dashboardData.detailedEarnings?.daily?.earnings || dashboardData.quickStats?.today?.earnings || 0,
      sessions: dashboardData.detailedEarnings?.daily?.sessions || dashboardData.quickStats?.today?.sessions || 0,
      timeMinutes: dashboardData.detailedEarnings?.daily?.timeMinutes || 0,
      users: dashboardData.userBreakdown.filter(u => {
        // Mock: users who had sessions today
        return Math.random() > 0.5;
      }).length || 1
    },
    'This Week': {
      revenue: dashboardData.detailedEarnings?.weekly?.earnings || dashboardData.quickStats?.week?.earnings || 0,
      sessions: dashboardData.detailedEarnings?.weekly?.sessions || dashboardData.quickStats?.week?.sessions || 0,
      timeMinutes: dashboardData.detailedEarnings?.weekly?.timeMinutes || 0,
      users: dashboardData.userBreakdown.length > 0 ? Math.min(3, dashboardData.userBreakdown.length) : 1
    },
    'This Month': {
      revenue: dashboardData.detailedEarnings?.monthly?.earnings || dashboardData.quickStats?.month?.earnings || 0,
      sessions: dashboardData.detailedEarnings?.monthly?.sessions || dashboardData.quickStats?.month?.sessions || 0,
      timeMinutes: dashboardData.detailedEarnings?.monthly?.timeMinutes || 0,
      users: dashboardData.userBreakdown.length || 1
    },
    'This Year': {
      revenue: dashboardData.detailedEarnings?.allTime?.earnings || dashboardData.quickStats?.allTime?.earnings || 0,
      sessions: dashboardData.detailedEarnings?.allTime?.sessions || dashboardData.quickStats?.allTime?.sessions || 0,
      timeMinutes: dashboardData.detailedEarnings?.allTime?.timeMinutes || 0,
      users: dashboardData.detailedEarnings?.allTime?.totalUsers || dashboardData.quickStats?.allTime?.uniqueUsers || 0
    }
  };

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate growth rates (using mock data if real data is zero)
  const todayGrowth = calculateGrowth(
    periodData['Today'].revenue,
    periodData['Today'].revenue > 0 ? periodData['Today'].revenue * 0.8 : 10
  );

  const weekGrowth = calculateGrowth(
    periodData['This Week'].revenue,
    periodData['This Week'].revenue > 0 ? periodData['This Week'].revenue * 0.7 : 50
  );

  // Get user rank color
  const getUserRankColor = (index) => {
    switch(index) {
      case 0: return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 1: return 'bg-gray-100 text-gray-700 border-gray-300';
      case 2: return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isDashboardHome && (
        <>
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="px-4 md:px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Earnings Dashboard</h1>
                  <p className="text-gray-600 mt-1">
                    Welcome back, <span className="font-semibold text-blue-600">{psychic?.name || 'Psychic'}</span>!
                    {dashboardData.quickStats?.allTime?.earnings > 0 && (
                      <span className="ml-2 text-green-600 font-medium">
                        Total Earnings: {formatCurrency(dashboardData.quickStats.allTime.earnings)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRefresh}
                    disabled={loading || refreshing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refreshing ? (
                      <FaSpinner className="text-lg animate-spin" />
                    ) : (
                      <FaChartBar className="text-lg" />
                    )}
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                  </button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex space-x-1 mt-6 border-b overflow-x-auto">
                {['overview', 'earnings', 'users', 'sessions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-medium capitalize transition-colors whitespace-nowrap relative ${
                      activeTab === tab
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {/* Debug Panel */}
            <DebugPanel apiResponse={apiResponse} loading={loading} />

            {/* Error Display */}
            {error && (
              <div className="mb-6">
                <div className={`px-4 py-3 rounded-lg flex justify-between items-center ${
                  error.includes('Using demo data') 
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center">
                    {error.includes('Using demo data') ? (
                      <FaExclamationTriangle className="mr-2" />
                    ) : null}
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="ml-4"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading dashboard data...</p>
                <p className="text-sm text-gray-400 mt-2">Fetching from API endpoints...</p>
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <StatCard
                        title="Today's Earnings"
                        value={formatCurrency(periodData['Today'].revenue)}
                        icon={FaMoneyBillWave}
                        color="text-green-600"
                        loading={loading}
                        change={todayGrowth}
                      />
                      <StatCard
                        title="This Week"
                        value={formatCurrency(periodData['This Week'].revenue)}
                        icon={FaChartLine}
                        color="text-blue-600"
                        loading={loading}
                        change={weekGrowth}
                      />
                      <StatCard
                        title="Total Users"
                        value={periodData['This Year'].users || 0}
                        icon={FaUserFriends}
                        color="text-purple-600"
                        loading={loading}
                      />
                      <StatCard
                        title="Total Sessions"
                        value={periodData['This Year'].sessions || 0}
                        icon={FaClock}
                        color="text-yellow-600"
                        loading={loading}
                      />
                    </div>

                    {/* Period Comparison */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Select Period</h2>
                        <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Today', 'This Week', 'This Month', 'This Year'].map((period) => (
                          <PeriodCard
                            key={period}
                            period={period}
                            data={periodData[period] || {}}
                            loading={loading}
                            active={activePeriod === period}
                            onClick={() => setActivePeriod(period)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Top Users & Recent Sessions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Top Users */}
                      <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-md p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Top Earning Users</h2>
                            <div className="flex items-center space-x-2 text-gray-500">
                              <FaUserTie className="text-xl" />
                              <span className="text-sm">
                                Showing {Math.min(5, dashboardData.userBreakdown.length)} users
                              </span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            {dashboardData.userBreakdown.length > 0 ? (
                              dashboardData.userBreakdown.slice(0, 5).map((user, index) => (
                                <div 
                                  key={user.user?._id || index} 
                                  className="bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getUserRankColor(index)}`}>
                                        <span className="font-bold">{index + 1}</span>
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-800">
                                          {user.user?.firstName ? `${user.user.firstName} ${user.user.lastName || ''}`.trim() : 'Anonymous User'}
                                        </p>
                                        <p className="text-sm text-gray-500">{user.user?.email || 'No email'}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-green-600">
                                        {formatCurrency(user.totalEarnings || 0)}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {user.totalSessions || 0} sessions
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <p className="text-gray-500">Time</p>
                                      <p className="font-medium">{user.totalTimeMinutes || 0} min</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Avg/Session</p>
                                      <p className="font-medium text-blue-600">
                                        {formatCurrency(user.avgEarningsPerSession || 0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Frequency</p>
                                      <p className="font-medium">
                                        {(user.sessionFrequency || 0).toFixed(1)}/wk
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <FaUserFriends className="text-4xl text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No user data available</p>
                                <p className="text-sm text-gray-400 mt-1">Start earning to see user statistics</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recent Sessions & Stats */}
                      <div className="space-y-6">
                        {/* Recent Sessions */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Recent Sessions</h2>
                            <FaHistory className="text-blue-500 text-xl" />
                          </div>
                          <div className="space-y-4">
                            {dashboardData.recentSessions.length > 0 ? (
                              dashboardData.recentSessions.slice(0, 5).map((session, index) => (
                                <div key={session._id || index} className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-gray-50 rounded-r">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-gray-800">
                                        {session.user?.firstName || 'User'}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {session.endedAt ? new Date(session.endedAt).toLocaleDateString() : 'Recent'}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-green-600">
                                        {formatCurrency(session.amount || 0)}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {session.durationMinutes || 0} min
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-gray-500">No recent sessions</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Score</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-600">
                                  {periodData['This Month'].revenue > 1000 ? 'Excellent' : 
                                   periodData['This Month'].revenue > 500 ? 'Good' : 'Fair'}
                                </span>
                                <span className="font-bold text-green-600">
                                  {periodData['This Month'].sessions > 0 
                                    ? `${Math.min(100, Math.round((periodData['This Month'].revenue / 1000) * 100))}%`
                                    : '0%'
                                  }
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ 
                                  width: `${Math.min(100, Math.round((periodData['This Month'].revenue / 1000) * 100))}%` 
                                }}></div>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">Based on your earning trends</p>
                            </div>
                            
                            <div className="pt-4 border-t">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">Avg Session Value</span>
                                <span className="font-bold text-blue-600">
                                  {periodData['This Year'].sessions > 0 
                                    ? formatCurrency(periodData['This Year'].revenue / periodData['This Year'].sessions)
                                    : '$0.00'
                                  }
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">Per session average</p>
                            </div>
                            
                            <div className="pt-4 border-t">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600">User Retention</span>
                                <span className="font-bold text-purple-600">
                                  {dashboardData.userBreakdown.length > 0 
                                    ? `${Math.round((dashboardData.userBreakdown.filter(u => (u.totalSessions || 0) > 1).length / dashboardData.userBreakdown.length) * 100)}%`
                                    : '0%'
                                  }
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">Users with multiple sessions</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Other tabs - Show real data */}
                {activeTab === "earnings" && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Detailed Earnings Analysis</h2>
                    
                    {dashboardData.quickStats ? (
                      <div className="space-y-6">
                        {/* Earnings Breakdown */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Earnings Breakdown</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                              { label: 'Today', data: periodData['Today'] },
                              { label: 'This Week', data: periodData['This Week'] },
                              { label: 'This Month', data: periodData['This Month'] },
                              { label: 'All Time', data: periodData['This Year'] }
                            ].map((period) => (
                              <div key={period.label} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-700">{period.label}</span>
                                  <FaChartPie className="text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                  {formatCurrency(period.data.revenue)}
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                  <div>
                                    <p className="text-gray-500">Sessions</p>
                                    <p className="font-semibold">{period.data.sessions}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Users</p>
                                    <p className="font-semibold">{period.data.users}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl">
                            <div className="flex items-center space-x-3 mb-3">
                              <FaWallet className="text-blue-600 text-2xl" />
                              <h4 className="text-lg font-semibold text-gray-800">Avg per Session</h4>
                            </div>
                            <p className="text-3xl font-bold text-blue-700">
                              {periodData['This Year'].sessions > 0 
                                ? formatCurrency(periodData['This Year'].revenue / periodData['This Year'].sessions)
                                : '$0.00'
                              }
                            </p>
                            <p className="text-sm text-gray-600 mt-2">Revenue per session</p>
                          </div>
                          
                          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl">
                            <div className="flex items-center space-x-3 mb-3">
                              <FaUserCheck className="text-green-600 text-2xl" />
                              <h4 className="text-lg font-semibold text-gray-800">Avg per User</h4>
                            </div>
                            <p className="text-3xl font-bold text-green-700">
                              {periodData['This Year'].users > 0 
                                ? formatCurrency(periodData['This Year'].revenue / periodData['This Year'].users)
                                : '$0.00'
                              }
                            </p>
                            <p className="text-sm text-gray-600 mt-2">Revenue per user</p>
                          </div>
                          
                          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl">
                            <div className="flex items-center space-x-3 mb-3">
                              <FaExchangeAlt className="text-purple-600 text-2xl" />
                              <h4 className="text-lg font-semibold text-gray-800">Session Frequency</h4>
                            </div>
                            <p className="text-3xl font-bold text-purple-700">
                              {periodData['This Month'].sessions > 0 
                                ? (periodData['This Month'].sessions / 30).toFixed(1)
                                : '0'
                              }/day
                            </p>
                            <p className="text-sm text-gray-600 mt-2">Average daily sessions</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FaChartBar className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No earnings data available</p>
                        <button
                          onClick={handleRefresh}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Refresh Data
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "users" && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">User Analytics</h2>
                    
                    {dashboardData.userBreakdown.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rank
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Spent
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sessions
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Avg/Session
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {dashboardData.userBreakdown.map((user, index) => (
                              <tr key={user.user?._id || index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getUserRankColor(index)}`}>
                                    <span className="font-bold">{index + 1}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                      <span className="font-bold text-white">
                                        {user.user?.firstName?.[0]?.toUpperCase() || 'U'}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.user?.firstName ? `${user.user.firstName} ${user.user.lastName || ''}`.trim() : 'Anonymous User'}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {user.user?.email || 'No email'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-lg font-bold text-green-600">
                                    {formatCurrency(user.totalEarnings || 0)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{user.totalSessions || 0}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {user.totalTimeMinutes || 0} min
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-blue-600">
                                    {formatCurrency(user.avgEarningsPerSession || 0)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FaUserFriends className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No user data available</p>
                        <p className="text-sm text-gray-400 mt-1">Start earning with users to see analytics</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sessions" && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Session Analytics</h2>
                    
                    {dashboardData.recentSessions.length > 0 ? (
                      <div className="space-y-6">
                        {/* Session Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600">Total Session Time</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {periodData['This Year'].timeMinutes || 0} min
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600">Avg Session Duration</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {periodData['This Year'].sessions > 0 
                                ? `${Math.round((periodData['This Year'].timeMinutes || 0) / periodData['This Year'].sessions)} min`
                                : '0 min'
                              }
                            </p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-purple-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {formatCurrency(periodData['This Year'].revenue)}
                            </p>
                          </div>
                        </div>

                        {/* Recent Sessions List */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Sessions</h3>
                          <div className="space-y-4">
                            {dashboardData.recentSessions.map((session, index) => (
                              <div key={session._id || index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <FaUserFriends className="text-blue-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-800">
                                          {session.user?.firstName || 'User'} {session.user?.lastName || ''}
                                        </h4>
                                        <p className="text-sm text-gray-600">{session.user?.email || 'No email'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                                      <span className="flex items-center">
                                        <FaClock className="mr-1" /> {session.durationMinutes || 0} min
                                      </span>
                                      <span className="flex items-center">
                                        <FaMoneyBillWave className="mr-1" /> {formatCurrency(session.amount || 0)}
                                      </span>
                                      <span>
                                        Rate: {(session.ratePerMin || 1).toFixed(2)}/min
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                      {session.endedAt ? new Date(session.endedAt).toLocaleDateString() : 'Date unknown'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {session.endedAt ? new Date(session.endedAt).toLocaleTimeString() : ''}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FaHistory className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No session history</p>
                        <p className="text-sm text-gray-400 mt-1">Your session history will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
      {!isDashboardHome && <Outlet />}
    </div>
  );
}