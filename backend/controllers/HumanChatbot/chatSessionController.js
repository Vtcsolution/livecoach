// controllers/chatSessionController.js
const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const User = require('../../models/User');
const Psychic = require('../../models/HumanChat/Psychic');
const MessageBox = require('../../models/HumanChat/MessageBox');

// Create a new chat session
// controllers/chatSessionController.js - Update createChatSession
exports.createChatSession = async (req, res) => {
  try {
    const { psychicId } = req.body;
    const userId = req.user._id;

    // Check if psychic exists and is verified
    const psychic = await Psychic.findOne({ _id: psychicId, isVerified: true });
    if (!psychic) {
      return res.status(404).json({ success: false, message: 'Psychic not found or not verified' });
    }

    // Check for existing active chat session
    const existingSession = await HumanChatSession.findOne({
      user: userId,
      psychic: psychicId,
      status: { $in: ['active', 'waiting'] }
    });

    if (existingSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'Chat session already exists',
        chatSessionId: existingSession._id 
      });
    }

    // Create new chat session
    const chatSession = new HumanChatSession({
      user: userId,
      psychic: psychicId,
      status: 'waiting' // Waiting for psychic to accept
    });

    await chatSession.save();

    // Populate for response
    const populatedSession = await HumanChatSession.findById(chatSession._id)
      .populate('user', 'firstName lastName username image')
      .populate('psychic', 'name email image ratePerMin bio');

    // ========== CRITICAL: EMIT SOCKET EVENT ==========
    if (global.io) {
      // Emit to psychic's personal room
      const psychicRoom = `psychic_${psychicId}`;
      global.io.to(psychicRoom).emit('new_chat_session', {
        chatSession: populatedSession,
        createdAt: Date.now()
      });
      
      // Also emit to the chat room (for real-time updates)
      const chatRoom = `chat_${chatSession._id}`;
      global.io.to(chatRoom).emit('session_created', {
        chatSession: populatedSession
      });
      
      console.log(`📢 Emitted new_chat_session to psychic ${psychicId} in room ${psychicRoom}`);
    }
    // =================================================

    res.status(201).json({
      success: true,
      chatSession: populatedSession
    });

  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get user's chat sessions
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const query = userModel === 'User' 
      ? { user: userId }
      : { psychic: userId };

    const chatSessions = await HumanChatSession.find(query)
      .populate('user', 'firstName lastName username image')
      .populate('psychic', 'name email image ratePerMin bio')
      .populate({
        path: 'lastMessage',
        select: 'content sender senderModel createdAt messageType'
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      chatSessions,
      total: chatSessions.length
    });

  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get specific chat session details
exports.getChatSession = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const chatSession = await HumanChatSession.findOne({
      _id: chatSessionId,
      $or: [
        { user: userId },
        { psychic: userId }
      ]
    })
    .populate('user', 'firstName lastName username image')
    .populate('psychic', 'name email image ratePerMin bio')
    .populate({
      path: 'lastMessage',
      select: 'content sender senderModel createdAt messageType'
    });

    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    res.status(200).json({
      success: true,
      chatSession
    });

  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update chat session status
exports.updateChatStatus = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const { status, blockReason } = req.body;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const chatSession = await HumanChatSession.findById(chatSessionId);
    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    // Check authorization (only participants can update)
    const isParticipant = 
      (userModel === 'User' && chatSession.user.toString() === userId.toString()) ||
      (userModel === 'Psychic' && chatSession.psychic.toString() === userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update status
    chatSession.status = status;
    
    if (status === 'ended') {
      chatSession.endedAt = Date.now();
    } else if (status === 'blocked') {
      chatSession.blockedBy = userId;
      chatSession.blockedByModel = userModel;
      chatSession.blockReason = blockReason || null;
    } else if (status === 'active') {
      chatSession.startedAt = Date.now();
    }

    await chatSession.save();

    // Emit status change
    const roomName = `chat_${chatSessionId}`;
    if (io) {
      io.to(roomName).emit('chat_status_changed', {
        chatSessionId,
        status,
        updatedBy: userId,
        updatedAt: chatSession.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      chatSession
    });

  } catch (error) {
    console.error('Update chat status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Search chat participants
exports.searchParticipants = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    let participants = [];

    if (userModel === 'User') {
      // Users search for psychics
      participants = await Psychic.find({
        $and: [
          { isVerified: true },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
              { bio: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      })
      .select('name email image ratePerMin bio gender isVerified')
      .limit(10);
    } else {
      // Psychics search for users
      participants = await User.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .select('firstName lastName username email image gender')
      .limit(10);
    }

    res.status(200).json({
      success: true,
      participants
    });

  } catch (error) {
    console.error('Search participants error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.checkChatSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const psychicId = req.params.psychicId;

    // Optional: ensure psychic exists & is verified
    const psychic = await Psychic.findOne({ _id: psychicId, isVerified: true });
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: "Psychic not found or not verified"
      });
    }

    const session = await HumanChatSession.findOne({
      user: userId,
      psychic: psychicId,
      status: { $in: ["active", "waiting"] }
    })
      .populate("user", "firstName lastName username image")
      .populate("psychic", "name email image ratePerMin bio")
      .populate({
        path: "lastMessage",
        select: "content sender senderModel createdAt messageType"
      });

    if (!session) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      session
    });

  } catch (error) {
    console.error("Check chat session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get psychic's chat sessions
// In controllers/chatSessionController.js, update getPsychicChats:
// In controllers/chatSessionController.js - FIXED getPsychicChats
exports.getPsychicChats = async (req, res) => {
  try {
    const psychicId = req.user._id;

    // Find chat sessions with proper null handling
    const chatSessions = await HumanChatSession.find({ psychic: psychicId })
      .populate("user", "firstName lastName username image email")
      .populate("psychic", "name email image ratePerMin bio")
      .populate({
        path: "lastMessage",
        select: "content sender senderModel createdAt messageType status"
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    // Format sessions with robust null checks
    const formattedSessions = chatSessions.map(session => {
      // Check if user exists
      let userData = null;
      if (session.user) {
        userData = {
          _id: session.user._id,
          firstName: session.user.firstName || 'User',
          lastName: session.user.lastName || '',
          username: session.user.username || 'user',
          image: session.user.image,
          email: session.user.email
        };
      } else {
        // Handle deleted users
        userData = {
          _id: 'deleted_user',
          firstName: 'Deleted',
          lastName: 'User',
          username: 'deleted_user',
          image: null,
          email: null
        };
      }

      // Check if psychic exists
      let psychicData = null;
      if (session.psychic) {
        psychicData = {
          _id: session.psychic._id,
          name: session.psychic.name,
          email: session.psychic.email,
          image: session.psychic.image,
          ratePerMin: session.psychic.ratePerMin,
          bio: session.psychic.bio
        };
      }

      return {
        _id: session._id,
        user: userData,
        psychic: psychicData ? psychicData._id : null,
        psychicData: psychicData,
        status: session.status || 'waiting',
        unreadCounts: session.unreadCounts || { user: 0, psychic: 0 },
        lastMessage: session.lastMessage || null,
        lastMessageAt: session.lastMessageAt || session.updatedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      chatSessions: formattedSessions,
      total: formattedSessions.length
    });

  } catch (error) {
    console.error("Get psychic chats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};