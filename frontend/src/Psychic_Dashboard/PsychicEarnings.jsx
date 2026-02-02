import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FaDollarSign,
  FaChartLine,
  FaUsers,
  FaClock,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaCalendar,
  FaUserTie,
  FaHistory,
  FaSpinner,
  FaArrowUp,
  FaArrowDown,
  FaPercent,
  FaMoneyBillWave,
  FaChartBar,
  FaFilter,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, change = null, loading = false, onClick = null }) => (
  <div 
    className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer ${loading ? 'animate-pulse' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-2">
          {loading ? "..." : value}
        </h3>
        {change !== null && !loading && (
          <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {change > 0 ? <FaArrowUp className="mr-1" /> : 
             change < 0 ? <FaArrowDown className="mr-1" /> : 
             <span className="mr-1">→</span>}
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
// Period Card Component - Updated
const PeriodCard = ({ period, data, loading = false, active = false, onClick }) => {
  const getPeriodIcon = (period) => {
    switch (period) {
      case 'today': return FaCalendarDay;
      case 'week': return FaCalendarWeek;
      case 'month': return FaCalendarAlt;
      case 'year': return FaCalendar;
      default: return FaCalendar;
    }
  };
  
  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return period;
    }
  };
  
  // Extract data based on period
  const getPeriodData = () => {
    if (!data) return {};
    
    // Handle different possible data structures
    if (typeof data === 'object') {
      if (data.earnings !== undefined) {
        // Direct earnings data
        return {
          revenue: data.earnings,
          sessions: data.sessions || data.totalSessions || 0,
          users: data.users || data.totalUsers || 0,
          timeMinutes: data.timeMinutes || data.totalTimeMinutes || 0
        };
      }
      
      // Check for revenue field instead of earnings
      if (data.revenue !== undefined) {
        return {
          revenue: data.revenue,
          sessions: data.sessions || 0,
          users: data.users || 0,
          timeMinutes: data.timeMinutes || 0
        };
      }
    }
    
    return {};
  };
  
  const periodData = getPeriodData();
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
          {getPeriodLabel(period)}
        </h4>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Revenue</span>
          <span className={`font-semibold ${active ? 'text-blue-700' : 'text-green-600'}`}>
            {loading ? "..." : formatCurrency(periodData.revenue || 0)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Sessions</span>
          <span className="font-semibold">
            {loading ? "..." : periodData.sessions || 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Users</span>
          <span className="font-semibold">
            {loading ? "..." : periodData.users || 0}
          </span>
        </div>
        {(periodData.timeMinutes || 0) > 0 && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-gray-600">Chat Time</span>
            <span className="font-semibold">
              {loading ? "..." : `${periodData.timeMinutes || 0} min`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
// User Earnings Card Component
const UserEarningsCard = ({ user, rank, onViewDetails }) => (
  <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          rank === 1 ? 'bg-yellow-100 border-2 border-yellow-300' : 
          rank === 2 ? 'bg-gray-100 border-2 border-gray-300' : 
          rank === 3 ? 'bg-orange-100 border-2 border-orange-300' : 'bg-blue-100 border-2 border-blue-300'
        }`}>
          <span className={`font-bold ${
            rank === 1 ? 'text-yellow-700' : 
            rank === 2 ? 'text-gray-700' : 
            rank === 3 ? 'text-orange-700' : 'text-blue-700'
          }`}>
            {rank}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800 truncate">
            {user.user?.firstName ? `${user.user.firstName} ${user.user.lastName || ''}`.trim() : 
             user.userName || "Anonymous User"}
          </p>
          <p className="text-sm text-gray-500 truncate">{user.user?.email || user.userEmail || "No email"}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-green-600">
          {formatCurrency(user.totalEarnings)}
        </p>
        <p className="text-sm text-gray-500">
          {user.totalSessions || 0} sessions
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
      <div className="text-center">
        <p className="text-gray-500">Time</p>
        <p className="font-medium">{user.totalTimeMinutes || 0} min</p>
      </div>
      <div className="text-center">
        <p className="text-gray-500">Avg/Session</p>
        <p className="font-medium text-blue-600">{formatCurrency(user.avgEarningsPerSession || 0)}</p>
      </div>
      <div className="text-center">
        <p className="text-gray-500">Frequency</p>
        <p className="font-medium">{user.sessionFrequency?.toFixed(1) || 0}/wk</p>
      </div>
    </div>
    
    <button
      onClick={() => onViewDetails(user.user?._id)}
      className="w-full mt-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center justify-center"
    >
      <FaEye className="mr-2" /> View Details
    </button>
  </div>
);

// Earnings Chart Component (Placeholder)
const EarningsChart = ({ data, period }) => {
  // This would be replaced with an actual chart library like Recharts or Chart.js
  return (
   <div>
    
   </div>
  );
};

// Filter Component
const FilterComponent = ({ filters, onFilterChange, onReset }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
   <div></div>
  );
};

// Format currency helper
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date helper
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const PsychicEarnings = () => {
  const navigate = useNavigate();
  
  // State variables
  const [earningsData, setEarningsData] = useState(null);
  const [userEarnings, setUserEarnings] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activePeriod, setActivePeriod] = useState('month');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    minAmount: '',
    minSessions: '',
    searchQuery: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'totalEarnings', direction: 'desc' });
  const [showUserModal, setShowUserModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Create API instance
  const api = useRef(
    axios.create({
      baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:5001',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  // Add request interceptor to include token
  useEffect(() => {
    const requestInterceptor = api.current.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('psychicToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      api.current.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('psychicToken');
    if (!token) {
      setError('Please login to view earnings');
      setLoading(false);
      navigate('/psychic/login');
      return;
    }
  }, [navigate]);

  // Fetch earnings data
 // Update the fetchEarningsData function:
const fetchEarningsData = async () => {
  try {
    setError(null);
    const response = await api.current.get('/api/chatrequest/psychic/earnings');
    
    // Process the data to ensure proper structure
    const processedData = processEarningsData(response.data);
    setEarningsData(processedData);
    return { success: true, data: processedData };
  } catch (err) {
    console.error('Error fetching earnings:', err);
    let errorMessage = 'Failed to fetch earnings data';
    
    if (err.response) {
      if (err.response.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.removeItem('psychicToken');
        localStorage.removeItem('psychicData');
        setTimeout(() => navigate('/psychic/login'), 2000);
      } else if (err.response.data?.message) {
        errorMessage = err.response.data.message;
      }
    } else if (err.request) {
      errorMessage = 'No response from server. Please check your connection.';
    }
    
    setError(errorMessage);
    return { success: false, message: errorMessage };
  }
};

// Add this data processing function:
const processEarningsData = (data) => {
  if (!data) return null;
  
  // Ensure the data has proper structure
  const processed = { ...data };
  
  // If data is nested in a 'data' property
  if (processed.data) {
    processed.data = {
      ...processed.data,
      summary: processed.data.summary || {
        daily: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
        weekly: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
        monthly: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
        allTime: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0, totalUsers: 0 }
      }
    };
  } else {
    // Create default structure if not present
    processed.data = {
      summary: {
        daily: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
        weekly: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
        monthly: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
        allTime: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0, totalUsers: 0 }
      },
      userBreakdown: [],
      recentSessions: []
    };
  }
  
  return processed;
};

  // Fetch user-specific earnings
  const fetchUserEarnings = async (userId) => {
    try {
      setLoading(true);
      const response = await api.current.get(`/api/chatrequest/psychic/earnings/user/${userId}`);
      setUserEarnings(response.data);
      setSelectedUser(response.data.user);
      setShowUserModal(true);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching user earnings:', err);
      setError('Failed to fetch user earnings data');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
   // In your useEffect or handleRefresh function:
const loadData = async () => {
  setLoading(true);
  const result = await fetchEarningsData();
  if (result.success && result.data) {
    console.log('API Response Structure:', result.data);
    console.log('Summary data:', result.data.data?.summary);
    console.log('Daily data:', result.data.data?.summary?.daily);
    console.log('Weekly data:', result.data.data?.summary?.weekly);
    console.log('Monthly data:', result.data.data?.summary?.monthly);
    console.log('AllTime data:', result.data.data?.summary?.allTime);
  }
  setLoading(false);
};

    loadData();
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchEarningsData();
    setRefreshing(false);
  };

  // Handle period change
  const handlePeriodChange = (period) => {
    setActivePeriod(period);
    // In a real app, you might want to refetch data for the selected period
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      minAmount: '',
      minSessions: '',
      searchQuery: ''
    });
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle export
  const handleExport = async () => {
    setExporting(true);
    try {
      // In a real app, you would call an export endpoint
      console.log('Exporting data...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create CSV data
      const csvData = [
        ['Date', 'User', 'Amount', 'Duration', 'Sessions'],
        ...(earningsData?.data?.recentSessions || []).map(session => [
          new Date(session.endedAt).toLocaleDateString(),
          session.user?.firstName || 'Unknown',
          session.amount,
          `${session.durationMinutes} min`,
          1
        ])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Close user modal
  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setUserEarnings(null);
  };

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get data for active period
 // Get data for active period
const getActivePeriodData = () => {
  if (!earningsData?.data?.summary) return null;
  
  // Handle different data structures
  const summary = earningsData.data.summary;
  
  switch (activePeriod) {
    case 'today': 
      return summary.daily || summary.today || { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 };
    case 'week': 
      return summary.weekly || summary.week || { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 };
    case 'month': 
      return summary.monthly || summary.month || { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 };
    case 'year': 
      return summary.allTime || summary.year || summary || { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 };
    default: 
      return summary.monthly || { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 };
  }
};
  // Filter and sort users
  const getFilteredSortedUsers = () => {
    if (!earningsData?.data?.userBreakdown) return [];
    
    let users = [...earningsData.data.userBreakdown];
    
    // Apply filters
    if (filters.minAmount) {
      users = users.filter(user => user.totalEarnings >= parseFloat(filters.minAmount));
    }
    
    if (filters.minSessions) {
      users = users.filter(user => (user.totalSessions || 0) >= parseInt(filters.minSessions));
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      users = users.filter(user => 
        user.user?.firstName?.toLowerCase().includes(query) ||
        user.user?.lastName?.toLowerCase().includes(query) ||
        user.user?.email?.toLowerCase().includes(query) ||
        user.userName?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    users.sort((a, b) => {
      const aValue = a[sortConfig.key] || 0;
      const bValue = b[sortConfig.key] || 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
    
    return users;
  };

 // Summary data - with fallback values
const summary = earningsData?.data?.summary || {
  daily: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
  weekly: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
  monthly: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0 },
  allTime: { earnings: 0, sessions: 0, users: 0, timeMinutes: 0, totalUsers: 0 }
};

// Ensure allTime has earnings property
if (summary.allTime && summary.allTime.earnings === undefined) {
  summary.allTime.earnings = summary.allTime.revenue || 0;
}

// For backward compatibility
if (summary.daily && summary.daily.earnings === undefined) {
  summary.daily.earnings = summary.daily.revenue || 0;
}

if (summary.weekly && summary.weekly.earnings === undefined) {
  summary.weekly.earnings = summary.weekly.revenue || 0;
}

if (summary.monthly && summary.monthly.earnings === undefined) {
  summary.monthly.earnings = summary.monthly.revenue || 0;
}

  // Active period data
  const activePeriodData = getActivePeriodData();
  const filteredUsers = getFilteredSortedUsers();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Earnings Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your earnings, analyze trends, and understand your performance</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              disabled={exporting || !earningsData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {exporting ? <FaSpinner className="animate-spin" /> : <FaDownload />}
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {refreshing ? <FaSpinner className="animate-spin" /> : <FaChartBar />}
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              ✕
            </button>
          </div>
        )}
      </div>

      {loading && !earningsData ? (
        <div className="text-center py-12">
          <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Earnings"
              value={formatCurrency(summary.allTime.earnings)}
              icon={FaDollarSign}
              color="text-green-600"
              change={calculateGrowth(summary.monthly.earnings, summary.weekly.earnings)}
              loading={loading}
              onClick={() => handlePeriodChange('year')}
            />
            <StatCard
              title="Active Users"
              value={summary.allTime.totalUsers}
              icon={FaUsers}
              color="text-blue-600"
              change={calculateGrowth(summary.monthly.users, summary.weekly.users)}
              loading={loading}
            />
            <StatCard
              title="Total Sessions"
              value={summary.allTime.sessions}
              icon={FaChartLine}
              color="text-purple-600"
              change={calculateGrowth(summary.monthly.sessions, summary.weekly.sessions)}
              loading={loading}
            />
            <StatCard
              title="Chat Time"
              value={`${summary.allTime.timeMinutes} min`}
              icon={FaClock}
              color="text-yellow-600"
              change={calculateGrowth(summary.monthly.timeMinutes, summary.weekly.timeMinutes)}
              loading={loading}
            />
          </div>

          {/* Period Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Period</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['today', 'week', 'month', 'year'].map((period) => (
                <PeriodCard
                  key={period}
                  period={period}
                  data={summary[period === 'today' ? 'daily' : 
                               period === 'week' ? 'weekly' : 
                               period === 'month' ? 'monthly' : 'allTime']}
                  loading={loading}
                  active={activePeriod === period}
                  onClick={() => handlePeriodChange(period)}
                />
              ))}
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="mb-8">
            <EarningsChart data={activePeriodData} period={activePeriod} />
          </div>

          {/* Filters */}
          <FilterComponent 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          

          {/* User Earnings Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">User Earnings</h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {earningsData?.data?.userBreakdown?.length || 0} users
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort('rank')}
                        className="flex items-center space-x-1"
                      >
                        <span>Rank</span>
                        {sortConfig.key === 'rank' && (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort('userName')}
                        className="flex items-center space-x-1"
                      >
                        <span>User</span>
                        {sortConfig.key === 'userName' && (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort('totalEarnings')}
                        className="flex items-center space-x-1"
                      >
                        <span>Total Spent</span>
                        {sortConfig.key === 'totalEarnings' && (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort('totalSessions')}
                        className="flex items-center space-x-1"
                      >
                        <span>Sessions</span>
                        {sortConfig.key === 'totalSessions' && (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort('totalTimeMinutes')}
                        className="flex items-center space-x-1"
                      >
                        <span>Chat Time</span>
                        {sortConfig.key === 'totalTimeMinutes' && (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort('avgEarningsPerSession')}
                        className="flex items-center space-x-1"
                      >
                        <span>Avg/Session</span>
                        {sortConfig.key === 'avgEarningsPerSession' && (
                          sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user.user?._id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                            index === 1 ? 'bg-gray-100 text-gray-700' : 
                            index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}>
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
                            {formatCurrency(user.totalEarnings)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.totalSessions}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => fetchUserEarnings(user.user?._id)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                            >
                              Details
                            </button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                              Contact
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center">
                        <FaUserTie className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No users found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Users Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Top Earning Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.slice(0, 6).map((user, index) => (
                <UserEarningsCard
                  key={user.user?._id || index}
                  user={user}
                  rank={index + 1}
                  onViewDetails={(userId) => fetchUserEarnings(userId)}
                />
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          {earningsData?.data?.recentSessions?.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Sessions</h2>
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  View All →
                </button>
              </div>
              <div className="space-y-4">
                {earningsData.data.recentSessions.slice(0, 5).map((session, index) => (
                  <div key={session._id || index} className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-gray-50 rounded-r-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">
                          {session.user?.firstName || 'User'} {session.user?.lastName || ''}
                        </p>
                        <p className="text-sm text-gray-500">{session.user?.email || 'No email'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(session.amount || 0)}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{session.durationMinutes || 0} min</span>
                          <span>{formatDate(session.endedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Performance Score</h3>
                <FaChartLine className="text-2xl" />
              </div>
              <p className="text-3xl font-bold">Excellent</p>
              <p className="text-blue-100 mt-2">Based on your earning trends</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Avg Session Value</h3>
                <FaMoneyBillWave className="text-2xl" />
              </div>
              <p className="text-3xl font-bold">
                {summary.allTime.sessions > 0 
                  ? formatCurrency(summary.allTime.earnings / summary.allTime.sessions)
                  : '$0.00'
                }
              </p>
              <p className="text-green-100 mt-2">Per session average</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">User Retention</h3>
                <FaUsers className="text-2xl" />
              </div>
              <p className="text-3xl font-bold">
                {filteredUsers.filter(u => (u.totalSessions || 0) > 1).length > 0 
                  ? `${Math.round((filteredUsers.filter(u => (u.totalSessions || 0) > 1).length / filteredUsers.length) * 100)}%`
                  : '0%'
                }
              </p>
              <p className="text-purple-100 mt-2">Users with multiple sessions</p>
            </div>
          </div>
        </>
      )}

      {/* User Earnings Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedUser.firstName} {selectedUser.lastName || ''}'s Details
                  </h2>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
                <button
                  onClick={handleCloseUserModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading user details...</p>
                </div>
              ) : userEarnings ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {selectedUser.firstName?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {selectedUser.firstName} {selectedUser.lastName || ''}
                        </h3>
                        <p className="text-gray-600">{selectedUser.email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Member since: {formatDate(selectedUser.joinedDate || selectedUser.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['daily', 'weekly', 'monthly', 'allTime'].map((period) => {
                      const periodData = userEarnings.earnings?.[period];
                      if (!periodData) return null;
                      
                      return (
                        <div key={period} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="text-sm text-gray-500 capitalize mb-2">{period}</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(periodData.amount || 0)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {periodData.sessions || 0} sessions
                          </div>
                          {periodData.timeMinutes > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {periodData.timeMinutes} min
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Spending Pattern */}
                  {userEarnings.spendingPattern && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending Pattern</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Trend</p>
                          <p className={`font-semibold capitalize ${
                            userEarnings.spendingPattern.spendingTrend === 'increasing' ? 'text-green-600' :
                            userEarnings.spendingPattern.spendingTrend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {userEarnings.spendingPattern.spendingTrend || 'stable'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avg Spacing</p>
                          <p className="font-semibold text-gray-800">
                            {userEarnings.spendingPattern.avgSpacingDays?.toFixed(1) || 0} days
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Frequency</p>
                          <p className="font-semibold text-gray-800">
                            {userEarnings.spendingPattern.frequency?.toFixed(1) || 0}/month
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Predicted Value</p>
                          <p className="font-semibold text-blue-600">
                            {formatCurrency(userEarnings.predictedValue?.monthly || 0)}/mo
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Session History */}
                  {userEarnings.sessionHistory?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Session History</h3>
                      <div className="space-y-3">
                        {userEarnings.sessionHistory.map((session, idx) => (
                          <div key={session._id || idx} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-800">
                                  Session {idx + 1}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {session.endTime ? formatDate(session.endTime) : 'Date unknown'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {formatCurrency(session.amount || 0)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {session.durationMinutes || 0} min
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCloseUserModal}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Export User Report
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No user data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychicEarnings;