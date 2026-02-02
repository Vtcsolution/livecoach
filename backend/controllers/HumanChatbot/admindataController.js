// controllers/HumanChatbot/admindataController.js

const Psychic = require('../../models/HumanChat/Psychic');
const MessageBox = require('../../models/HumanChat/MessageBox');
const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const ChatRequest = require('../../models/Paidtimer/ChatRequest');
const User = require('../../models/User');
const mongoose = require('mongoose');

/**
 * @desc    Get total counts for dashboard
 * @route   GET /api/admin/chats
 * @access  Private/Admin
 */
const getAllChatData = async (req, res) => {
  try {
    // Run all count queries in parallel for better performance
    const [
      totalPsychics,
      totalSessions,
      totalPaidTimers,
      totalChatRequests,
      totalUsers,
      activeSessions,
      activePaidTimers,
      pendingRequests,
      recentPsychics,
      recentSessions
    ] = await Promise.all([
      // 1. Total Psychics
      Psychic.countDocuments(),
      
      // 2. Total Sessions (only completed/ended)
      HumanChatSession.countDocuments({ 
        status: { $in: ['ended', 'completed'] } 
      }),
      
      // 3. Total Paid Timers (completed)
      ChatRequest.countDocuments({ 
        status: 'completed',
        totalAmountPaid: { $gt: 0 }
      }),
      
      // 4. Total Chat Requests (all statuses)
      ChatRequest.countDocuments(),
      
      // 5. Total Users
      User.countDocuments(),
      
      // 6. Active Sessions
      HumanChatSession.countDocuments({ status: 'active' }),
      
      // 7. Active Paid Timers
      ChatRequest.countDocuments({ 
        'paidSession.isActive': true,
        status: 'active'
      }),
      
      // 8. Pending Requests
      ChatRequest.countDocuments({ status: 'pending' }),
      
      // 9. Recent Psychics (last 30 days)
      Psychic.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      
      // 10. Recent Sessions (last 7 days)
      HumanChatSession.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get total revenue from paid timers
    const revenueStats = await ChatRequest.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'active'] },
          totalAmountPaid: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmountPaid' },
          totalSeconds: { $sum: '$paidSession.totalSeconds' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get psychic list with basic info
    const psychicList = await Psychic.find()
      .select('name email isVerified averageRating totalRatings ratePerMin createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent paid timers
    const recentPaidTimers = await ChatRequest.find({
      status: 'completed',
      totalAmountPaid: { $gt: 0 }
    })
    .populate('user', 'name email')
    .populate('psychic', 'name email ratePerMin')
    .sort({ endedAt: -1 })
    .limit(10);

    // Get recent sessions
    const recentSessionList = await HumanChatSession.find({
      status: { $in: ['active', 'ended'] }
    })
    .populate('user', 'name email')
    .populate('psychic', 'name email')
    .sort({ lastMessageAt: -1 })
    .limit(10);

    // Prepare response data
    const dashboardData = {
      totals: {
        psychics: totalPsychics,
        sessions: totalSessions,
        paidTimers: totalPaidTimers,
        chatRequests: totalChatRequests,
        users: totalUsers
      },
      currentStatus: {
        activeSessions,
        activePaidTimers,
        pendingRequests
      },
      recentActivity: {
        psychics: recentPsychics,
        sessions: recentSessions
      },
      financials: {
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        totalPaidTime: Math.round((revenueStats[0]?.totalSeconds || 0) / 3600 * 100) / 100, // in hours
        avgSessionValue: revenueStats[0]?.count > 0 ? 
          Math.round((revenueStats[0]?.totalRevenue / revenueStats[0]?.count) * 100) / 100 : 0
      },
      lists: {
        psychics: psychicList,
        recentPaidTimers: recentPaidTimers.map(timer => ({
          _id: timer._id,
          user: timer.user?.name || 'Unknown User',
          psychic: timer.psychic?.name || 'Unknown Psychic',
          amount: timer.totalAmountPaid,
          duration: timer.paidSession?.totalSeconds ? 
            Math.round(timer.paidSession.totalSeconds / 60 * 100) / 100 : 0, // in minutes
          endedAt: timer.endedAt
        })),
        recentSessions: recentSessionList.map(session => ({
          _id: session._id,
          user: session.user?.name || 'Unknown User',
          psychic: session.psychic?.name || 'Unknown Psychic',
          status: session.status,
          duration: session.sessionDuration || 0,
          lastMessageAt: session.lastMessageAt
        }))
      },
      timestamp: new Date().toISOString(),
      lastUpdated: Date.now()
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get detailed information about a specific psychic
 * @route   GET /api/admin/chats/psychics/:id
 * @access  Private/Admin
 */
const getPsychicDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }

    console.log(`🔍 Fetching psychic details for ID: ${id}`);

    // 1. Get psychic basic information
    const psychic = await Psychic.findById(id)
      .select('name email image ratePerMin abilities averageRating totalRatings bio gender isVerified type status createdAt updatedAt')
      .lean();

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    console.log(`✅ Found psychic: ${psychic.name}`);

    // 2. Get all chat sessions for this psychic
    const chatSessions = await HumanChatSession.find({ psychic: id })
      .populate('user', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(20);

    // 3. Get paid timer sessions for this psychic
    const paidTimers = await ChatRequest.find({ psychic: id })
      .populate('user', 'name email')
      .sort({ endedAt: -1 })
      .limit(20);

    // 4. Calculate statistics
    const totalSessions = chatSessions.length;
    const totalPaidTimers = paidTimers.length;
    
    // Calculate total earnings
    const earningsStats = await ChatRequest.aggregate([
      {
        $match: {
          psychic: new mongoose.Types.ObjectId(id),
          status: { $in: ['completed', 'active'] },
          totalAmountPaid: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$psychic',
          totalEarnings: { $sum: '$totalAmountPaid' },
          totalSessions: { $sum: 1 },
          totalTime: { $sum: '$paidSession.totalSeconds' }
        }
      }
    ]);

    const earningsData = earningsStats[0] || {
      totalEarnings: 0,
      totalSessions: 0,
      totalTime: 0
    };

    // 5. Get recent reviews/ratings (if available in your model)
    const recentReviews = psychic.reviews || [];

    // 6. Calculate performance metrics
    const activeChats = chatSessions.filter(session => session.status === 'active').length;
    const completedChats = chatSessions.filter(session => session.status === 'ended' || session.status === 'completed').length;
    
    // Calculate average session duration
    const totalDuration = chatSessions.reduce((sum, session) => sum + (session.sessionDuration || 0), 0);
    const avgSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60) : 0; // in minutes

    // 7. Get popular user interactions (most frequent users)
    const userInteractions = await ChatRequest.aggregate([
      {
        $match: { psychic: new mongoose.Types.ObjectId(id) }
      },
      {
        $group: {
          _id: '$user',
          totalSessions: { $sum: 1 },
          totalSpent: { $sum: '$totalAmountPaid' },
          lastSession: { $max: '$endedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          userId: '$_id',
          userName: '$userDetails.name',
          userEmail: '$userDetails.email',
          totalSessions: 1,
          totalSpent: 1,
          lastSession: 1
        }
      },
      {
        $sort: { totalSessions: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // 8. Get monthly earnings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await ChatRequest.aggregate([
      {
        $match: {
          psychic: new mongoose.Types.ObjectId(id),
          endedAt: { $gte: sixMonthsAgo },
          totalAmountPaid: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$endedAt' },
            month: { $month: '$endedAt' }
          },
          totalEarnings: { $sum: '$totalAmountPaid' },
          sessionCount: { $sum: 1 },
          totalMinutes: { 
            $sum: { 
              $divide: ['$paidSession.totalSeconds', 60] 
            } 
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          totalEarnings: 1,
          sessionCount: 1,
          totalMinutes: 1,
          period: {
            $concat: [
              { $arrayElemAt: [['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], { $subtract: ['$_id.month', 1] }] },
              ' ',
              { $toString: '$_id.year' }
            ]
          }
        }
      }
    ]);

    // 9. Prepare the response data
    const psychicDetails = {
      profile: {
        ...psychic,
        joinDate: psychic.createdAt,
        isActive: psychic.status === 'active'
      },
      statistics: {
        totals: {
          sessions: totalSessions,
          paidTimers: totalPaidTimers,
          earnings: earningsData.totalEarnings,
          hoursWorked: Math.round(earningsData.totalTime / 3600 * 100) / 100,
          ratings: psychic.totalRatings || 0,
          averageRating: psychic.averageRating || 0
        },
        current: {
          activeChats: activeChats,
          pendingRequests: await ChatRequest.countDocuments({ psychic: id, status: 'pending' }),
          avgSessionDuration: avgSessionDuration
        },
        performance: {
          completionRate: totalSessions > 0 ? Math.round((completedChats / totalSessions) * 100) : 0,
          avgEarningsPerSession: earningsData.totalSessions > 0 ? 
            Math.round((earningsData.totalEarnings / earningsData.totalSessions) * 100) / 100 : 0,
          earningsPerHour: earningsData.totalTime > 0 ? 
            Math.round((earningsData.totalEarnings / (earningsData.totalTime / 3600)) * 100) / 100 : 0
        }
      },
      financials: {
        totalEarnings: earningsData.totalEarnings,
        avgEarningsPerMonth: monthlyEarnings.length > 0 ? 
          Math.round(monthlyEarnings.reduce((sum, month) => sum + month.totalEarnings, 0) / monthlyEarnings.length * 100) / 100 : 0,
        monthlyBreakdown: monthlyEarnings,
        ratePerMinute: psychic.ratePerMin,
        estimatedMonthlyEarnings: psychic.ratePerMin * 40 * 20 * 4 // rate * 40min/session * 20sessions/week * 4weeks
      },
      recentActivity: {
        chatSessions: chatSessions.map(session => ({
          _id: session._id,
          user: session.user?.name || 'Unknown User',
          status: session.status,
          duration: session.sessionDuration || 0,
          lastMessageAt: session.lastMessageAt,
          startedAt: session.startedAt,
          endedAt: session.endedAt
        })),
        paidTimers: paidTimers.map(timer => ({
          _id: timer._id,
          user: timer.user?.name || 'Unknown User',
          amount: timer.totalAmountPaid || 0,
          duration: timer.paidSession?.totalSeconds ? Math.round(timer.paidSession.totalSeconds / 60 * 100) / 100 : 0,
          status: timer.status,
          endedAt: timer.endedAt,
          isActive: timer.paidSession?.isActive || false
        })),
        recentReviews: recentReviews.slice(0, 5)
      },
      userInteractions: userInteractions,
      timeline: {
        createdAt: psychic.createdAt,
        lastActive: chatSessions[0]?.lastMessageAt || psychic.updatedAt,
        totalOnlineTime: Math.round(earningsData.totalTime / 3600 * 100) / 100
      },
      metadata: {
        lastUpdated: new Date(),
        dataPoints: {
          sessionsAnalyzed: totalSessions,
          paidTimersAnalyzed: totalPaidTimers,
          monthsAnalyzed: monthlyEarnings.length
        }
      }
    };

    res.status(200).json({
      success: true,
      data: psychicDetails,
      message: 'Psychic details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get psychic details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching psychic details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all psychics with summary statistics
 * @route   GET /api/admin/chats/psychics
 * @access  Private/Admin
 */
/**
 * @desc    Get all psychics with summary statistics
 * @route   GET /api/admin/chats/psychics
 * @access  Private/Admin
 */
const getAllPsychics = async (req, res) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log(`📊 Fetching psychics - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    // Get all psychics with pagination
    const psychics = await Psychic.find()
      .select('name email image ratePerMin averageRating totalRatings isVerified status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`✅ Found ${psychics.length} psychics in database`);

    // Get total count for pagination
    const totalPsychics = await Psychic.countDocuments();
    console.log(`📈 Total psychics in DB: ${totalPsychics}`);

    // Get earnings and session counts for each psychic in parallel
    const psychicsWithStats = await Promise.all(
      psychics.map(async (psychic) => {
        // Get earnings stats
        const earningsStats = await ChatRequest.aggregate([
          {
            $match: {
              psychic: psychic._id,
              status: { $in: ['completed', 'active'] },
              totalAmountPaid: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: '$psychic',
              totalEarnings: { $sum: '$totalAmountPaid' },
              totalSessions: { $sum: 1 },
              totalTime: { $sum: '$paidSession.totalSeconds' }
            }
          }
        ]);

        const earningsData = earningsStats[0] || {
          totalEarnings: 0,
          totalSessions: 0,
          totalTime: 0
        };

        // Get active sessions count
        const activeSessions = await HumanChatSession.countDocuments({
          psychic: psychic._id,
          status: 'active'
        });

        return {
          ...psychic,
          statistics: {
            totalEarnings: earningsData.totalEarnings,
            totalSessions: earningsData.totalSessions,
            totalHours: Math.round(earningsData.totalTime / 3600 * 100) / 100,
            activeSessions: activeSessions,
            avgSessionValue: earningsData.totalSessions > 0 ? 
              Math.round((earningsData.totalEarnings / earningsData.totalSessions) * 100) / 100 : 0,
            earningsPerHour: earningsData.totalTime > 0 ? 
              Math.round((earningsData.totalEarnings / (earningsData.totalTime / 3600)) * 100) / 100 : 0
          }
        };
      })
    );

    // Calculate overall statistics
    const overallStats = await ChatRequest.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'active'] },
          totalAmountPaid: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalAmountPaid' },
          totalSessions: { $sum: 1 },
          avgEarningsPerSession: { $avg: '$totalAmountPaid' }
        }
      }
    ]);

    const response = {
      success: true,
      data: {
        psychics: psychicsWithStats,
        pagination: {
          page,
          limit,
          total: totalPsychics,
          pages: Math.ceil(totalPsychics / limit)
        },
        summary: {
          totalPsychics: totalPsychics,
          totalEarnings: overallStats[0]?.totalEarnings || 0,
          totalSessions: overallStats[0]?.totalSessions || 0,
          avgEarningsPerSession: overallStats[0]?.avgEarningsPerSession || 0
        }
      },
      message: 'Psychics list retrieved successfully'
    };

    console.log('✅ Sending response with', psychicsWithStats.length, 'psychics');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Get all psychics error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching psychics list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Helper function to format user name properly
const formatUserName = (user) => {
  if (!user) return 'Unknown User';
  
  // Check different possible name fields
  if (user.name) return user.name;
  if (user.fullName) return user.fullName;
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  if (user.email) return user.email.split('@')[0]; // Use email prefix as fallback
  
  return 'Unknown User';
};

const getChatById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }

    console.log(`🔍 Fetching chat session with ID: ${id}`);

    // 1. Get the HumanChatSession by ID - UPDATED POPULATE FIELDS
    const chatSession = await HumanChatSession.findById(id)
      .populate('user', 'firstName lastName email avatar fullName phone country')
      .populate('psychic', 'name email image ratePerMin abilities averageRating totalRatings bio gender isVerified type')
      .populate('lastMessage');

    if (!chatSession) {
      console.log(`❌ HumanChatSession not found: ${id}`);
      
      // Try to find as ChatRequest and see if there's a related session
      const chatRequest = await ChatRequest.findById(id)
        .populate('user', 'firstName lastName email avatar')
        .populate('psychic', 'name email image ratePerMin');
      
      if (chatRequest) {
        // Find related HumanChatSession for this ChatRequest
        const relatedSession = await HumanChatSession.findOne({
          user: chatRequest.user,
          psychic: chatRequest.psychic
        })
        .populate('user', 'firstName lastName email avatar')
        .populate('psychic', 'name email image ratePerMin');
        
        if (relatedSession) {
          return res.status(200).json({
            success: true,
            message: 'Found related session for this chat request',
            redirect: `/api/admin/chats/${relatedSession._id}`,
            chatRequest: {
              _id: chatRequest._id,
              status: chatRequest.status,
              amount: chatRequest.totalAmountPaid
            },
            sessionId: relatedSession._id
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    console.log(`✅ Found HumanChatSession: ${id}`);
    console.log('👤 User:', chatSession.user);
    console.log(`🔮 Psychic: ${chatSession.psychic?.name || chatSession.psychic}`);

    // 2. Get all messages for this chat session - UPDATED POPULATE FIELDS
    const messages = await MessageBox.find({ 
      chatSession: id 
    })
    .populate('sender', 'firstName lastName name email avatar')
    .populate('receiver', 'firstName lastName name email avatar')
    .populate('replyTo')
    .sort({ createdAt: 1 })
    .lean();

    console.log(`📨 Found ${messages.length} messages for session: ${id}`);

    // 3. Get related ChatRequest (paid timer) if exists
    const chatRequest = await ChatRequest.findOne({
      user: chatSession.user?._id || chatSession.user,
      psychic: chatSession.psychic?._id || chatSession.psychic
    })
    .sort({ createdAt: -1 })
    .lean();

    console.log(`💰 Found chat request: ${chatRequest ? 'Yes' : 'No'}`);

    // 4. Calculate session statistics
    const sessionStats = await MessageBox.aggregate([
      { $match: { chatSession: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          userMessages: { 
            $sum: { $cond: [{ $eq: ['$senderModel', 'User'] }, 1, 0] } 
          },
          psychicMessages: { 
            $sum: { $cond: [{ $eq: ['$senderModel', 'Psychic'] }, 1, 0] } 
          },
          readMessages: { 
            $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] } 
          },
          mediaMessages: { 
            $sum: { 
              $cond: [{ $in: ['$messageType', ['image', 'file']] }, 1, 0] 
            } 
          },
          firstMessageTime: { $min: '$createdAt' },
          lastMessageTime: { $max: '$createdAt' }
        }
      }
    ]);

    const stats = sessionStats[0] || {
      totalMessages: 0,
      userMessages: 0,
      psychicMessages: 0,
      readMessages: 0,
      mediaMessages: 0
    };

    // 5. Calculate duration
    let duration = 0;
    if (stats.firstMessageTime && stats.lastMessageTime) {
      duration = new Date(stats.lastMessageTime) - new Date(stats.firstMessageTime);
      duration = Math.round(duration / 1000);
    } else if (chatSession.startedAt && chatSession.endedAt) {
      duration = Math.round((new Date(chatSession.endedAt) - new Date(chatSession.startedAt)) / 1000);
    } else if (chatSession.sessionDuration) {
      duration = chatSession.sessionDuration;
    }

    // 6. Prepare participant information
    const participants = {
      user: {
        _id: chatSession.user?._id || chatSession.user,
        name: formatUserName(chatSession.user),
        email: chatSession.user?.email || '',
        avatar: chatSession.user?.avatar || '',
        firstName: chatSession.user?.firstName || '',
        lastName: chatSession.user?.lastName || '',
        fullName: chatSession.user?.fullName || '',
        type: 'user'
      },
      psychic: {
        _id: chatSession.psychic?._id || chatSession.psychic,
        name: chatSession.psychic?.name || 'Unknown Psychic',
        email: chatSession.psychic?.email || '',
        image: chatSession.psychic?.image || '',
        ratePerMin: chatSession.psychic?.ratePerMin || 0,
        averageRating: chatSession.psychic?.averageRating || 0,
        totalRatings: chatSession.psychic?.totalRatings || 0,
        type: 'psychic'
      }
    };

    // 7. Prepare message history with formatted data
    const formattedMessages = messages.map(msg => {
      const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
      const isUser = senderId === participants.user._id.toString();
      
      // Determine sender info
      let senderInfo = {
        _id: msg.sender?._id || msg.sender,
        type: isUser ? 'user' : 'psychic'
      };
      
      if (isUser) {
        senderInfo.name = participants.user.name;
        senderInfo.avatar = participants.user.avatar;
      } else {
        senderInfo.name = participants.psychic.name;
        senderInfo.avatar = participants.psychic.image;
      }
      
      // Determine receiver info
      let receiverInfo = {
        _id: msg.receiver?._id || msg.receiver,
        type: isUser ? 'psychic' : 'user'
      };
      
      if (isUser) {
        receiverInfo.name = participants.psychic.name;
      } else {
        receiverInfo.name = participants.user.name;
      }
      
      // Use message sender/receiver data if available, otherwise use participants data
      if (msg.sender) {
        const senderName = formatUserName(msg.sender);
        if (senderName && senderName !== 'Unknown User') {
          senderInfo.name = senderName;
        }
      }
      if (msg.receiver) {
        const receiverName = formatUserName(msg.receiver);
        if (receiverName && receiverName !== 'Unknown User') {
          receiverInfo.name = receiverName;
        }
      }
      if (msg.sender?.avatar) {
        senderInfo.avatar = msg.sender.avatar;
      }
      
      return {
        _id: msg._id,
        content: msg.content,
        messageType: msg.messageType,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        isRead: msg.isRead,
        readAt: msg.readAt,
        status: msg.status,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        sender: senderInfo,
        receiver: receiverInfo,
        replyTo: msg.replyTo,
        reactions: msg.reactions || []
      };
    });

    // 8. Prepare chat request/payment info
    const paymentInfo = chatRequest ? {
      _id: chatRequest._id,
      status: chatRequest.status,
      totalAmountPaid: chatRequest.totalAmountPaid || 0,
      remainingBalance: chatRequest.remainingBalance || 0,
      ratePerMin: chatRequest.ratePerMin || participants.psychic.ratePerMin,
      initialBalance: chatRequest.initialBalance || 0,
      hasPaidTimer: !!(chatRequest.paidSession?.isActive),
      paidSession: chatRequest.paidSession ? {
        isActive: chatRequest.paidSession.isActive,
        isPaused: chatRequest.paidSession.isPaused,
        remainingSeconds: chatRequest.paidSession.remainingSeconds,
        totalSeconds: chatRequest.paidSession.totalSeconds,
        startTime: chatRequest.paidSession.startTime,
        lastSyncTime: chatRequest.paidSession.lastSyncTime
      } : null,
      deductions: chatRequest.deductions || []
    } : null;

    // 9. Prepare response data
    const chatData = {
      session: {
        _id: chatSession._id,
        status: chatSession.status,
        startedAt: chatSession.startedAt,
        endedAt: chatSession.endedAt,
        lastMessageAt: chatSession.lastMessageAt,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
        unreadCounts: chatSession.unreadCounts || {
          user: 0,
          psychic: 0
        },
        lastMessage: chatSession.lastMessage
      },
      participants,
      messages: {
        total: stats.totalMessages,
        userMessages: stats.userMessages,
        psychicMessages: stats.psychicMessages,
        readMessages: stats.readMessages,
        unreadMessages: stats.totalMessages - stats.readMessages,
        mediaMessages: stats.mediaMessages,
        history: formattedMessages
      },
      statistics: {
        duration: {
          seconds: duration,
          minutes: Math.round(duration / 60 * 100) / 100,
          hours: Math.round(duration / 3600 * 100) / 100,
          formatted: formatDuration(duration)
        },
        conversationTimeline: {
          firstMessage: stats.firstMessageTime,
          lastMessage: stats.lastMessageTime,
          messageFrequency: stats.totalMessages > 0 && duration > 0 ? 
            Math.round((stats.totalMessages / duration) * 60 * 100) / 100 : 0
        },
        userEngagement: {
          messageRatio: stats.totalMessages > 0 ? 
            Math.round((stats.userMessages / stats.totalMessages) * 100) : 0,
          averageResponseTime: calculateAverageResponseTime(formattedMessages)
        }
      },
      payment: paymentInfo,
      metadata: {
        sessionType: paymentInfo?.hasPaidTimer ? 'paid' : 'free',
        hasMedia: stats.mediaMessages > 0,
        isActive: chatSession.status === 'active',
        chatStarted: chatSession.startedAt ? true : false,
        chatEnded: chatSession.endedAt ? true : false
      }
    };

    console.log(`✅ Successfully retrieved chat data for session: ${id}`);
    console.log(`👤 User Name: ${participants.user.name}`);

    res.status(200).json({
      success: true,
      data: chatData,
      message: 'Chat session retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get chat by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate average response time
const calculateAverageResponseTime = (messages) => {
  if (messages.length < 2) return 0;
  
  let totalResponseTime = 0;
  let responseCount = 0;
  
  for (let i = 1; i < messages.length; i++) {
    const currentMsg = messages[i];
    const previousMsg = messages[i - 1];
    
    // Only calculate if messages are from different participants
    if (currentMsg.sender.type !== previousMsg.sender.type) {
      const responseTime = new Date(currentMsg.createdAt) - new Date(previousMsg.createdAt);
      totalResponseTime += responseTime;
      responseCount++;
    }
  }
  
  return responseCount > 0 ? 
    Math.round(totalResponseTime / responseCount / 1000) : 0; // in seconds
};

// Helper function to format duration
const formatDuration = (seconds) => {
  if (!seconds) return '0 seconds';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs > 1 ? 's' : ''}`);
  
  return parts.join(', ');
};

// Export controllers
module.exports = {
  getAllChatData,
  getChatById,
  getPsychicDetails,
  getAllPsychics,
  getUserChats: (req, res) => res.status(200).json({ 
    success: true, 
    message: 'This endpoint is no longer available' 
  }),
  getPsychicChats: (req, res) => res.status(200).json({ 
    success: true, 
    message: 'This endpoint is no longer available' 
  }),
  getChatRequests: (req, res) => res.status(200).json({ 
    success: true, 
    message: 'This endpoint is no longer available' 
  })
};