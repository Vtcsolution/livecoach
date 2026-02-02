// controllers/messageController.js

const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const User = require('../../models/User');
const Psychic = require('../../models/HumanChat/Psychic');
const MessageBox = require('../../models/HumanChat/MessageBox');

// Socket.IO instance
let io;

// Set socket instance
exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Helper function to emit socket messages with retry
const emitToSocket = (room, event, data, retryCount = 0) => {
  try {
    if (!global.io) {
      console.warn(`⚠️ Socket.io not available for ${event} to ${room}`);
      return false;
    }

    const maxRetries = 3;
    
    // Check if room exists
    const roomSockets = global.io.sockets.adapter.rooms.get(room);
    if (!roomSockets || roomSockets.size === 0) {
      console.log(`📭 No one in room ${room} for event ${event}`);
      
      // If no one in chat room, try personal room
      if (room.startsWith('chat_')) {
        const chatId = room.replace('chat_', '');
        // We'll handle this in the main logic
      }
    }

    console.log(`📤 Emitting ${event} to ${room}`, {
      messageId: data.message?._id,
      roomSize: roomSockets?.size || 0
    });

    // Emit with acknowledgement
    global.io.to(room).emit(event, data);
    return true;

  } catch (error) {
    console.error(`❌ Failed to emit ${event} to ${room}:`, error);
    
    // Retry logic
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying ${event} (${retryCount + 1}/${maxRetries})...`);
      setTimeout(() => emitToSocket(room, event, data, retryCount + 1), 1000);
    }
    
    return false;
  }
};

// CRITICAL: Get or create chat session
const getOrCreateChatSession = async (userId, psychicId, senderModel) => {
  try {
    console.log(`🔍 Looking for chat session: user=${userId}, psychic=${psychicId}`);
    
    // Check for existing session
    const existingSession = await HumanChatSession.findOne({
      user: userId,
      psychic: psychicId,
      status: { $in: ['active', 'waiting'] }
    })
    .populate('user', 'firstName lastName username image email')
    .populate('psychic', 'name email image ratePerMin bio');

    if (existingSession) {
      console.log(`✅ Found existing chat session: ${existingSession._id}`);
      return { session: existingSession, isNew: false };
    }

    // Create new session
    console.log(`🆕 Creating new chat session for user ${userId} with psychic ${psychicId}`);
    
    const newSession = new HumanChatSession({
      user: userId,
      psychic: psychicId,
      status: 'active', // Changed from 'waiting' to 'active' for immediate messaging
      unreadCounts: {
        user: 0,
        psychic: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newSession.save();

    // Populate the session
    const populatedSession = await HumanChatSession.findById(newSession._id)
      .populate('user', 'firstName lastName username image email')
      .populate('psychic', 'name email image ratePerMin bio');

    console.log(`✅ Created new chat session: ${populatedSession._id}`);
    
    // CRITICAL: Notify psychic about new session via socket
    if (global.io) {
      const psychicRoom = `psychic_${psychicId}`;
      const psychicSocketId = global.connectedUsers.get(psychicId.toString());
      
      if (psychicSocketId) {
        // Get psychic socket
        const psychicSocket = global.io.sockets.sockets.get(psychicSocketId);
        if (psychicSocket) {
          // Join psychic to the new chat room
          const chatRoom = `chat_${populatedSession._id}`;
          psychicSocket.join(chatRoom);
          console.log(`👥 Psychic ${psychicId} joined chat room: ${chatRoom}`);
          
          // Update psychic's connected sessions
          psychicSocket.emit('connected_sessions', [populatedSession._id.toString()]);
        }
        
        // Notify psychic about new session
        const sessionData = {
          _id: populatedSession._id,
          user: {
            _id: populatedSession.user._id,
            firstName: populatedSession.user.firstName,
            lastName: populatedSession.user.lastName,
            username: populatedSession.user.username,
            image: populatedSession.user.image,
            email: populatedSession.user.email
          },
          psychic: populatedSession.psychic._id,
          status: populatedSession.status,
          unreadCounts: populatedSession.unreadCounts,
          createdAt: populatedSession.createdAt,
          updatedAt: populatedSession.updatedAt
        };
        
        emitToSocket(psychicRoom, 'new_chat_session', {
          chatSession: sessionData,
          message: 'New chat session created'
        });
      }
    }

    return { session: populatedSession, isNew: true };

  } catch (error) {
    console.error('❌ Error in getOrCreateChatSession:', error);
    throw error;
  }
};

// MAIN: Send message
exports.sendMessage = async (req, res) => {
  try {
    const { chatSessionId, content, messageType, mediaUrl, replyTo, psychicId } = req.body;
    const senderId = req.user._id;
    const senderModel = req.user.role || 'User';

    console.log(`📝 sendMessage called:`, {
      chatSessionId,
      psychicId,
      senderId,
      senderModel,
      contentLength: content?.length
    });

    let chatSession;
    let isNewSession = false;

    // ========== STEP 1: GET OR CREATE CHAT SESSION ==========
    if (!chatSessionId && psychicId && senderModel === 'User') {
      // User sending first message to psychic
      const result = await getOrCreateChatSession(senderId, psychicId, senderModel);
      chatSession = result.session;
      isNewSession = result.isNew;
    } else {
      // Existing chat session
      chatSession = await HumanChatSession.findById(chatSessionId)
        .populate('user', 'firstName lastName username image email')
        .populate('psychic', 'name email image ratePerMin bio');

      if (!chatSession) {
        console.error('❌ Chat session not found:', chatSessionId);
        return res.status(404).json({ 
          success: false, 
          message: 'Chat session not found' 
        });
      }
    }

    // Verify sender is a participant
    const isSender = 
      (senderModel === 'User' && chatSession.user._id.toString() === senderId.toString()) ||
      (senderModel === 'Psychic' && chatSession.psychic._id.toString() === senderId.toString());
    
    if (!isSender) {
      console.error('❌ Sender not authorized:', { senderId, senderModel });
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to send message in this chat' 
      });
    }

    console.log(`✅ Sender authorized for session: ${chatSession._id}`);

    // ========== STEP 2: CREATE MESSAGE ==========
    const receiverId = senderModel === 'User' ? chatSession.psychic._id : chatSession.user._id;
    const receiverModel = senderModel === 'User' ? 'Psychic' : 'User';

    const message = new MessageBox({
      chatSession: chatSession._id,
      sender: senderId,
      senderModel,
      receiver: receiverId,
      receiverModel,
      content: content || '',
      messageType: messageType || 'text',
      mediaUrl,
      replyTo,
      status: 'sent',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await message.save();
    console.log(`✅ Message saved: ${message._id}`);

    // Populate message
    const populatedMessage = await MessageBox.findById(message._id)
      .populate('sender', 'name username email image')
      .populate('receiver', 'name username email image');

    // ========== STEP 3: UPDATE CHAT SESSION ==========
    chatSession.lastMessage = message._id;
    chatSession.lastMessageAt = new Date();
    
    // Increment unread count for receiver
    if (senderModel === 'User') {
      chatSession.unreadCounts.psychic = (chatSession.unreadCounts.psychic || 0) + 1;
      console.log(`📈 Incremented psychic unread count: ${chatSession.unreadCounts.psychic}`);
    } else {
      chatSession.unreadCounts.user = (chatSession.unreadCounts.user || 0) + 1;
      console.log(`📈 Incremented user unread count: ${chatSession.unreadCounts.user}`);
    }
    
    chatSession.updatedAt = new Date();
    await chatSession.save();
    console.log(`✅ Chat session updated: ${chatSession._id}`);

    // ========== STEP 4: EMIT SOCKET EVENTS (CRITICAL PART) ==========
    if (global.io) {
      const chatRoom = `chat_${chatSession._id}`;
      const senderName = senderModel === 'User' 
        ? `${chatSession.user.firstName} ${chatSession.user.lastName || ''}`.trim()
        : chatSession.psychic.name;
      
      // Prepare socket message data
      const socketMessageData = {
        _id: message._id,
        chatSession: chatSession._id,
        sender: {
          _id: senderId,
          name: senderName,
          email: senderModel === 'User' ? chatSession.user.email : chatSession.psychic.email,
          image: senderModel === 'User' ? chatSession.user.image : chatSession.psychic.image,
          model: senderModel
        },
        senderModel,
        receiver: {
          _id: receiverId,
          model: receiverModel
        },
        receiverModel,
        content: content || '',
        messageType: messageType || 'text',
        status: 'sent',
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      };

      console.log(`📤 Preparing to emit socket events for message ${message._id}`);

      // EMIT TO CHAT ROOM (Both participants should be here)
      console.log(`📍 Emitting to chat room: ${chatRoom}`);
      emitToSocket(chatRoom, 'new_message', {
        message: socketMessageData,
        chatSessionId: chatSession._id,
        senderId,
        senderModel,
        timestamp: Date.now()
      });

      // EMIT TO RECEIVER'S PERSONAL ROOM (For reliability)
      const receiverRoom = receiverModel === 'User' 
        ? `user_${receiverId}`
        : `psychic_${receiverId}`;
      
      console.log(`📍 Also emitting to receiver's personal room: ${receiverRoom}`);
      emitToSocket(receiverRoom, 'new_message', {
        message: socketMessageData,
        chatSessionId: chatSession._id,
        senderId,
        senderModel,
        timestamp: Date.now(),
        isDirectNotification: true
      });

      // EMIT UNREAD COUNT UPDATE
      const unreadEventData = {
        chatSessionId: chatSession._id,
        unreadCount: receiverModel === 'User' 
          ? chatSession.unreadCounts.user 
          : chatSession.unreadCounts.psychic
      };
      
      emitToSocket(receiverRoom, 'unread_count_updated', unreadEventData);
      
      // Also emit to chat room
      emitToSocket(chatRoom, 'unread_count_updated', unreadEventData);

      // EMIT MESSAGE NOTIFICATION (for push notifications, etc.)
      emitToSocket(receiverRoom, 'message_notification', {
        chatSessionId: chatSession._id,
        messageId: message._id,
        senderName: senderName,
        content: (content || '').substring(0, 100),
        timestamp: Date.now()
      });

      console.log(`✅ All socket events emitted for message ${message._id}`);
    }

    // ========== STEP 5: PREPARE RESPONSE ==========
    const response = {
      success: true,
      message: populatedMessage,
      chatSession: {
        _id: chatSession._id,
        status: chatSession.status,
        unreadCounts: chatSession.unreadCounts,
        lastMessageAt: chatSession.lastMessageAt
      }
    };

    // Include full session if new
    if (isNewSession) {
      response.newSession = true;
      response.fullChatSession = chatSession;
    }

    console.log(`🎉 Message sent successfully: ${message._id}`);
    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ========== REMAINING FUNCTIONS (unchanged but verified) ==========

// Get messages for a chat session
exports.getMessages = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    // Verify user has access to this chat
    const chatSession = await HumanChatSession.findOne({
      _id: chatSessionId,
      $or: [
        { user: userId },
        { psychic: userId }
      ]
    });

    if (!chatSession) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get messages
    const messages = await MessageBox.find({
      chatSession: chatSessionId,
      $or: [
        { isDeleted: false },
        { 
          isDeleted: true,
          deletedFor: { 
            $not: { 
              $elemMatch: { 
                userId: userId,
                userModel: userModel 
              } 
            } 
          }
        }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name username email image')
    .populate('receiver', 'name username email image')
    .populate({
      path: 'replyTo',
      select: 'content sender senderModel createdAt'
    });

    // Mark messages as read if viewing
    if (userModel === 'User') {
      await MessageBox.updateMany(
        {
          chatSession: chatSessionId,
          receiver: userId,
          receiverModel: 'User',
          isRead: false
        },
        { 
          isRead: true,
          readAt: Date.now(),
          status: 'read'
        }
      );
      
      // Reset unread count
      chatSession.unreadCounts.user = 0;
    } else {
      await MessageBox.updateMany(
        {
          chatSession: chatSessionId,
          receiver: userId,
          receiverModel: 'Psychic',
          isRead: false
        },
        { 
          isRead: true,
          readAt: Date.now(),
          status: 'read'
        }
      );
      
      // Reset unread count
      chatSession.unreadCounts.psychic = 0;
    }
    
    await chatSession.save();

    // Emit read status via socket
    if (global.io) {
      const roomName = `chat_${chatSessionId}`;
      emitToSocket(roomName, 'messages_read', {
        chatSessionId,
        readerId: userId,
        readerModel: userModel,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      page,
      limit,
      total: await MessageBox.countDocuments({ chatSession: chatSessionId })
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// React to a message with emoji
exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    // Find message
    const message = await MessageBox.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is participant in the chat
    const chatSession = await HumanChatSession.findById(message.chatSession);
    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    const isParticipant = 
      (userModel === 'User' && chatSession.user.toString() === userId.toString()) ||
      (userModel === 'Psychic' && chatSession.psychic.toString() === userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      reaction => !(reaction.userId.toString() === userId.toString() && reaction.userModel === userModel)
    );

    // Add new reaction
    message.reactions.push({
      userId,
      userModel,
      emoji,
      reactedAt: Date.now()
    });

    await message.save();

    // Emit reaction to chat room
    if (global.io) {
      const roomName = `chat_${message.chatSession}`;
      emitToSocket(roomName, 'message_reaction', {
        messageId: message._id,
        reaction: {
          userId,
          userModel,
          emoji
        }
      });
    }

    res.status(200).json({
      success: true,
      reactions: message.reactions
    });

  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    const message = await MessageBox.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is the sender
    const isSender = message.sender.toString() === userId.toString() && message.senderModel === userModel;
    
    if (!isSender) {
      return res.status(403).json({ success: false, message: 'Only sender can delete message' });
    }

    // Mark as deleted for everyone or just for specific users
    if (req.query.for === 'me') {
      // Delete only for the user
      message.deletedFor.push({
        userId,
        userModel
      });
    } else {
      // Delete for everyone
      message.isDeleted = true;
    }

    await message.save();

    // Emit delete event to chat room
    if (global.io) {
      const roomName = `chat_${message.chatSession}`;
      emitToSocket(roomName, 'message_deleted', {
        messageId: message._id,
        deletedForEveryone: !(req.query.for === 'me')
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    // Find chat session first
    const chatSession = await HumanChatSession.findById(chatSessionId);
    if (!chatSession) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chat session not found' 
      });
    }

    // Verify user has access
    const hasAccess = userModel === 'User' 
      ? chatSession.user.toString() === userId.toString()
      : chatSession.psychic.toString() === userId.toString();
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Update messages
    const updateQuery = {
      chatSession: chatSessionId,
      receiver: userId,
      receiverModel: userModel,
      isRead: false
    };

    const updateData = {
      isRead: true,
      readAt: Date.now(),
      status: 'read'
    };

    const result = await MessageBox.updateMany(updateQuery, updateData);

    // Update unread count in chat session
    if (userModel === 'User') {
      chatSession.unreadCounts.user = 0;
    } else {
      chatSession.unreadCounts.psychic = 0;
    }
    
    await chatSession.save();

    // Emit read receipt via socket
    if (global.io) {
      const roomName = `chat_${chatSessionId}`;
      emitToSocket(roomName, 'messages_read', {
        chatSessionId,
        readerId: userId,
        readerModel: userModel,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.user.role || 'User';

    // Get all chat sessions for user
    const chatSessions = await HumanChatSession.find(
      userModel === 'User' 
        ? { user: userId }
        : { psychic: userId }
    ).select('unreadCounts');

    const totalUnread = chatSessions.reduce((total, session) => {
      return total + (userModel === 'User' ? session.unreadCounts.user : session.unreadCounts.psychic);
    }, 0);

    res.status(200).json({
      success: true,
      totalUnread,
      byChat: chatSessions.map(session => ({
        chatSessionId: session._id,
        unreadCount: userModel === 'User' ? session.unreadCounts.user : session.unreadCounts.psychic
      }))
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};