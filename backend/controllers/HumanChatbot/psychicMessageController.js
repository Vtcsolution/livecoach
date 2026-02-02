// controllers/psychicMessageController.js
const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const User = require('../../models/User');
const Psychic = require('../../models/HumanChat/Psychic');
const MessageBox = require('../../models/HumanChat/MessageBox');

// Set socket instance
let io;
exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

exports.sendMessageAsPsychic = async (req, res) => {
  try {
    const { chatSessionId, content, messageType, mediaUrl, replyTo } = req.body;
    const senderId = req.user._id; // Psychic ID

    // Find chat session
    const chatSession = await HumanChatSession.findById(chatSessionId)
      .populate('user', 'firstName lastName username image')
      .populate('psychic', 'name email image');

    if (!chatSession) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat session not found' 
      });
    }

    // Verify psychic is the psychic in this chat
    if (chatSession.psychic._id.toString() !== senderId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Create message
    const message = new MessageBox({
      chatSession: chatSessionId,
      sender: senderId,
      senderModel: 'Psychic',
      receiver: chatSession.user._id,
      receiverModel: 'User',
      content,
      messageType: messageType || 'text',
      mediaUrl,
      replyTo,
      status: 'sent'
    });

    await message.save();

    // ========== CRITICAL: UPDATE CHAT SESSION ==========
    chatSession.lastMessage = message._id;
    chatSession.lastMessageAt = Date.now();
    chatSession.unreadCounts.user += 1; // Increment user's unread count
    chatSession.updatedAt = Date.now();
    await chatSession.save();

    // Populate message for response
    const populatedMessage = await MessageBox.findById(message._id)
      .populate('sender', 'name email image')
      .populate('receiver', 'firstName lastName email image')
      .populate({
        path: 'replyTo',
        select: 'content sender senderModel createdAt'
      });

    // ========== CRITICAL: EMIT SOCKET EVENT ==========
    if (global.io) {
      const emitData = {
        message: populatedMessage,
        chatSessionId,
        senderId,
        senderRole: 'psychic',
        timestamp: Date.now(),
        isPsychicMessage: true
      };

      // 1. Emit to chat room
      const chatRoom = `chat_${chatSessionId}`;
      global.io.to(chatRoom).emit('new_message', emitData);
      console.log(`📢 Psychic message emitted to chat room: ${chatRoom}`);

      // 2. Also emit to user's personal room for reliability
      const userRoom = `user_${chatSession.user._id}`;
      global.io.to(userRoom).emit('new_message', emitData);
      console.log(`📢 Psychic message also sent to user room: ${userRoom}`);

      // 3. Update unread count for user
      global.io.to(userRoom).emit('unread_count_updated', {
        chatSessionId,
        unreadCount: chatSession.unreadCounts.user
      });
    }

    res.status(201).json({
      success: true,
      message: populatedMessage
    });

  } catch (error) {
    console.error('Send message as psychic error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};
// Get messages for psychic
 // controllers/psychicMessageController.js - Update getMessagesAsPsychic
exports.getMessagesAsPsychic = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const psychicId = req.user._id;

    // Verify psychic has access to this chat
    const chatSession = await HumanChatSession.findOne({
      _id: chatSessionId,
      psychic: psychicId
    })
    .populate({
      path: 'user',
      select: 'firstName lastName username email image' // Populate user for context
    });

    if (!chatSession) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get messages - IMPORTANT: Include username in populate
    const messages = await MessageBox.find({
      chatSession: chatSessionId,
      $or: [
        { isDeleted: false },
        { 
          isDeleted: true,
          deletedFor: { 
            $not: { 
              $elemMatch: { 
                userId: psychicId,
                userModel: 'Psychic' 
              } 
            } 
          }
        }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'sender',
      select: 'name email image username' // Add username for psychic
    })
    .populate({
      path: 'receiver',
      select: 'firstName lastName username email image' // Add username for user
    })
    .populate({
      path: 'replyTo',
      select: 'content sender senderModel createdAt'
    });

    // Format messages to ensure consistent username display
    const formattedMessages = messages.map(message => {
      const messageObj = message.toObject();
      
      // Format sender info with username
      if (message.sender) {
        if (message.senderModel === 'User') {
          messageObj.sender = {
            ...message.sender,
            // For users, combine firstName/lastName and username
            name: `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.username,
            username: message.sender.username || 'user'
          };
        } else if (message.senderModel === 'Psychic') {
          messageObj.sender = {
            ...message.sender,
            // For psychics, ensure name is populated
            name: message.sender.name || 'Psychic',
            username: message.sender.username || message.sender.name?.toLowerCase()?.replace(/\s+/g, '')
          };
        }
      }
      
      // Format receiver info
      if (message.receiver) {
        messageObj.receiver = {
          ...message.receiver,
          // For users, combine firstName/lastName and username
          name: message.receiverModel === 'User' 
            ? `${message.receiver.firstName || ''} ${message.receiver.lastName || ''}`.trim() || message.receiver.username
            : message.receiver.name,
          username: message.receiver.username || 'user'
        };
      }
      
      return messageObj;
    });

    // Mark psychic's unread messages as read
    await MessageBox.updateMany(
      {
        chatSession: chatSessionId,
        receiver: psychicId,
        receiverModel: 'Psychic',
        isRead: false
      },
      { 
        isRead: true,
        readAt: Date.now(),
        status: 'read'
      }
    );
    
    // Reset psychic's unread count
    chatSession.unreadCounts.psychic = 0;
    await chatSession.save();

    res.status(200).json({
      success: true,
      messages: formattedMessages.reverse(), // Return in chronological order
      chatSessionInfo: {
        user: chatSession.user,
        psychic: chatSession.psychic
      },
      page,
      limit,
      total: await MessageBox.countDocuments({ chatSession: chatSessionId })
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Psychic-specific: Get active chat sessions
exports.getPsychicActiveChats = async (req, res) => {
  try {
    const psychicId = req.user._id;

    const chatSessions = await HumanChatSession.find({
      psychic: psychicId,
      status: { $in: ['active', 'waiting'] }
    })
    .populate('user', 'firstName lastName username image email')
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
    console.error('Get psychic active chats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Update chat status as psychic
exports.updateChatStatusAsPsychic = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const { status } = req.body;
    const psychicId = req.user._id;

    const chatSession = await HumanChatSession.findOne({
      _id: chatSessionId,
      psychic: psychicId
    });

    if (!chatSession) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat session not found' 
      });
    }

    // Update status
    chatSession.status = status;
    
    if (status === 'ended' || status === 'completed') {
      chatSession.endedAt = Date.now();
    } else if (status === 'active') {
      chatSession.startedAt = Date.now();
    }

    await chatSession.save();

    // Emit status change if socket available
    if (io) {
      const roomName = `chat_${chatSessionId}`;
      io.to(roomName).emit('chat_status_changed', {
        chatSessionId,
        status,
        updatedBy: psychicId,
        updatedAt: chatSession.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      chatSession
    });

  } catch (error) {
    console.error('Update chat status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Get psychic's unread message count
exports.getPsychicUnreadCount = async (req, res) => {
  try {
    const psychicId = req.user._id;

    // Get all chat sessions for psychic
    const chatSessions = await HumanChatSession.find({ psychic: psychicId })
      .select('unreadCounts');

    const totalUnread = chatSessions.reduce((total, session) => {
      return total + session.unreadCounts.psychic;
    }, 0);

    res.status(200).json({
      success: true,
      totalUnread,
      byChat: chatSessions.map(session => ({
        chatSessionId: session._id,
        unreadCount: session.unreadCounts.psychic
      }))
    });

  } catch (error) {
    console.error('Get psychic unread count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};