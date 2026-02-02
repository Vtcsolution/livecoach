// socketHandler.js - COMPLETE OPTIMIZED VERSION
module.exports = (io) => {
  // Store connected users
  const connectedUsers = new Map(); // userId -> socketId
  const userData = new Map(); // socketId -> {userId, userRole}
  const socketRooms = new Map(); // socketId -> Set of room names
  
  // ========== INSTANT STATUS CACHE ==========
  const psychicStatusCache = new Map(); // psychicId -> {status, lastSeen, lastActive, timestamp}
  const psychicConnections = new Map(); // psychicId -> {socketId, connectedAt}
  
  // ========== CACHE MANAGEMENT FUNCTIONS ==========
  const updatePsychicCache = (psychicId, status, lastSeen = null, lastActive = null) => {
    const now = Date.now();
    const cacheData = {
      status: status || 'offline',
      lastSeen: lastSeen || new Date(),
      lastActive: lastActive || new Date(),
      timestamp: now,
      lastUpdate: now
    };
    
    psychicStatusCache.set(psychicId.toString(), cacheData);
    
    // Update connection tracking
    if (status === 'online' || status === 'away' || status === 'busy') {
      psychicConnections.set(psychicId.toString(), {
        isOnline: true,
        lastHeartbeat: now
      });
    } else if (status === 'offline') {
      psychicConnections.delete(psychicId.toString());
    }
    
    return cacheData;
  };
  
  const getPsychicStatusFromCache = (psychicId) => {
    const cached = psychicStatusCache.get(psychicId.toString());
    if (!cached) return null;
    
    // If cache is fresh (less than 10 seconds), return it
    if (Date.now() - cached.timestamp < 10000) {
      return cached;
    }
    
    // If psychic has a live connection, they're online
    const connection = psychicConnections.get(psychicId.toString());
    if (connection && (Date.now() - connection.lastHeartbeat < 60000)) {
      return { ...cached, status: 'online', timestamp: Date.now() };
    }
    
    return cached;
  };
  
  const broadcastPsychicStatus = (psychicId, statusData) => {
    if (!io) return;
    
    // Emit to specific psychic room
    io.to(`psychic_status_${psychicId}`).emit('psychic_status_changed', statusData);
    
    // Emit to global room
    io.to('psychic_list_status').emit('psychic_status_update', statusData);
    
    console.log(`📡 Broadcast status for ${psychicId}: ${statusData.status}`);
  };
  
  // ========== INITIALIZE CACHE ON STARTUP ==========
  const initializeStatusCache = async () => {
    try {
      const Psychic = require('../models/HumanChat/Psychic');
      const psychics = await Psychic.find({})
        .select('_id status lastActive lastSeen lastStatusUpdate')
        .limit(100)
        .lean();
      
      psychics.forEach(psychic => {
        updatePsychicCache(
          psychic._id, 
          psychic.status || 'offline', 
          psychic.lastSeen, 
          psychic.lastActive
        );
      });
      
      console.log(`✅ Initialized cache with ${psychics.length} psychic statuses`);
    } catch (error) {
      console.error('Error initializing status cache:', error);
    }
  };
  
  // Initialize cache when server starts
  initializeStatusCache();

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    const { userId, token, role } = socket.handshake.auth;
    
    if (!userId || !role) {
      console.log('❌ Unauthenticated socket connection');
      socket.disconnect();
      return;
    }

    console.log(`✅ User connected: ${userId} (${role})`);
    
    // ========== INSTANT STATUS UPDATE FOR PSYCHICS ==========
    if (role.toLowerCase() === 'psychic') {
      // Update cache immediately (INSTANT)
      updatePsychicCache(userId, 'online');
      
      // Broadcast to all subscribed users immediately
      const statusData = {
        psychicId: userId.toString(),
        status: 'online',
        timestamp: Date.now(),
        lastSeen: new Date(),
        lastActive: new Date()
      };
      
      broadcastPsychicStatus(userId, statusData);
    }
    
    // Check if user already connected (avoid duplicates)
    const existingSocketId = connectedUsers.get(userId.toString());
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`⚠️ User ${userId} already connected with socket ${existingSocketId}, disconnecting old socket`);
      const oldSocket = io.sockets.sockets.get(existingSocketId);
      if (oldSocket) {
        oldSocket.disconnect();
      }
    }
    
    // Store user data
    connectedUsers.set(userId.toString(), socket.id);
    userData.set(socket.id, { 
      userId: userId.toString(), 
      role: role.toLowerCase() 
    });
    
    // Initialize room tracking for this socket
    socketRooms.set(socket.id, new Set());
    
    // Join personal room
    const personalRoom = role.toLowerCase() === 'user' ? `user_${userId}` : `psychic_${userId}`;
    socket.join(personalRoom);
    socketRooms.get(socket.id).add(personalRoom);
    console.log(`📍 Joined personal room: ${personalRoom}`);
    
    // Join timer room based on role
    if (role.toLowerCase() === 'psychic') {
      const timerRoom = `psychic_timer_${userId}`;
      socket.join(timerRoom);
      socketRooms.get(socket.id).add(timerRoom);
      console.log(`⏰ Joined psychic timer room: ${timerRoom}`);
    } else {
      const timerRoom = `user_timer_${userId}`;
      socket.join(timerRoom);
      socketRooms.get(socket.id).add(timerRoom);
      console.log(`⏰ Joined user timer room: ${timerRoom}`);
    }
    
    // ========== SEND INSTANT STATUSES TO USER ON CONNECTION ==========
    if (role.toLowerCase() === 'user') {
      // Send ALL cached statuses immediately (INSTANT, NO DB QUERY)
      const cachedStatuses = {};
      psychicStatusCache.forEach((value, key) => {
        cachedStatuses[key] = {
          status: value.status,
          lastSeen: value.lastSeen,
          lastActive: value.lastActive,
          lastUpdate: value.timestamp
        };
      });
      
      if (Object.keys(cachedStatuses).length > 0) {
        console.log(`⚡ Sending ${Object.keys(cachedStatuses).length} cached statuses to user ${userId}`);
        socket.emit('psychic_statuses_response', { statuses: cachedStatuses });
      }
      
      // Also join global status room
      socket.join('psychic_list_status');
      socketRooms.get(socket.id).add('psychic_list_status');
    }
    
    // If psychic, fetch and join their chat rooms
    if (role.toLowerCase() === 'psychic') {
      const ChatSession = require('../models/HumanChat/HumanChatSession');
      ChatSession.find({ psychic: userId })
        .select('_id')
        .then(sessions => {
          const sessionIds = sessions.map(s => s._id.toString());
          console.log(`📋 Psychic ${userId} has ${sessionIds.length} chat sessions`);
          
          // Join all chat rooms
          sessionIds.forEach(chatId => {
            const roomName = `chat_${chatId}`;
            if (!socketRooms.get(socket.id).has(roomName)) {
              socket.join(roomName);
              socketRooms.get(socket.id).add(roomName);
              console.log(`👥 Psychic joined room: ${roomName}`);
            }
          });
          
          // Send connected sessions to psychic
          socket.emit('connected_sessions', sessionIds);
        })
        .catch(err => console.error('Error fetching psychic sessions:', err));
    }

    // Send online status to all connected users
    const onlineStatus = {};
    connectedUsers.forEach((socketId, uid) => {
      const userInfo = userData.get(socketId);
      if (userInfo) {
        onlineStatus[uid] = 'online';
      }
    });
    
    // Notify others that this user is online
    socket.broadcast.emit('user_status_change', {
      userId,
      userRole: role,
      status: 'online',
      timestamp: Date.now()
    });

    // Send current online status to newly connected user
    socket.emit('online_users', onlineStatus);

    // ========== PSYCHIC STATUS SYSTEM ==========
    
    // Psychic updates their status - INSTANT
    socket.on('psychic_status_update', async (data) => {
      try {
        const { status, psychicId } = data;
        const { userId, role } = socket.handshake.auth;
        
        // Verify psychic owns this status update
        if (role !== 'psychic' || userId.toString() !== psychicId.toString()) {
          console.log('❌ Unauthorized psychic status update attempt');
          return;
        }
        
        console.log(`🔄 Psychic ${psychicId} status update: ${status}`);
        
        // Update cache immediately (INSTANT)
        const cacheData = updatePsychicCache(psychicId, status);
        
        // Broadcast immediately from cache (INSTANT)
        const statusData = {
          psychicId,
          status,
          timestamp: Date.now(),
          lastSeen: cacheData.lastSeen,
          lastActive: cacheData.lastActive
        };
        
        broadcastPsychicStatus(psychicId, statusData);
        
        // Update in database (async - don't wait)
        const Psychic = require('../models/HumanChat/Psychic');
        Psychic.findByIdAndUpdate(psychicId, { 
          status,
          lastStatusUpdate: new Date(),
          lastActive: new Date(),
          ...(status === 'offline' && { lastSeen: new Date() })
        }).catch(err => console.error('DB update error:', err));
        
      } catch (error) {
        console.error('Error updating psychic status:', error);
      }
    });

    // User subscribes to psychic status - INSTANT CACHE RESPONSE
    socket.on('subscribe_to_psychic_status', async ({ psychicIds }) => {
      if (!Array.isArray(psychicIds)) psychicIds = [psychicIds];
      
      console.log(`📊 ${socket.id} subscribing to ${psychicIds.length} psychic statuses`);
      
      // Join status rooms
      psychicIds.forEach(psychicId => {
        const roomName = `psychic_status_${psychicId}`;
        if (!socketRooms.get(socket.id).has(roomName)) {
          socket.join(roomName);
          socketRooms.get(socket.id).add(roomName);
        }
      });
      
      // Send immediate statuses from CACHE (INSTANT)
      psychicIds.forEach(psychicId => {
        const cached = getPsychicStatusFromCache(psychicId);
        if (cached) {
          socket.emit('psychic_status_changed', {
            psychicId,
            status: cached.status,
            timestamp: Date.now(),
            lastSeen: cached.lastSeen,
            lastActive: cached.lastActive
          });
        }
      });
      
      // Request fresh data from DB in background
      setTimeout(() => {
        const Psychic = require('../models/HumanChat/Psychic');
        Psychic.find({ 
          _id: { $in: psychicIds } 
        })
        .select('_id status lastActive lastSeen')
        .lean()
        .then(psychics => {
          psychics.forEach(psychic => {
            const cacheData = updatePsychicCache(
              psychic._id, 
              psychic.status || 'offline', 
              psychic.lastSeen, 
              psychic.lastActive
            );
            
            // Send updated status
            socket.emit('psychic_status_changed', {
              psychicId: psychic._id.toString(),
              status: cacheData.status,
              timestamp: Date.now(),
              lastSeen: cacheData.lastSeen,
              lastActive: cacheData.lastActive
            });
          });
        })
        .catch(err => console.error('Background status update error:', err));
      }, 1000); // Delay 1 second to not block instant response
    });

    // Get psychic statuses - INSTANT CACHE RESPONSE
    socket.on('get_psychic_statuses', async ({ psychicIds }) => {
      try {
        console.log(`🚀 Fast status request for ${psychicIds?.length || 0} psychics`);
        
        const now = Date.now();
        const statuses = {};
        const needsFetch = [];
        
        // 1. Check cache FIRST (INSTANT)
        psychicIds.forEach(psychicId => {
          const cached = getPsychicStatusFromCache(psychicId);
          if (cached) {
            statuses[psychicId] = {
              status: cached.status,
              lastSeen: cached.lastSeen,
              lastActive: cached.lastActive,
              lastStatusUpdate: cached.timestamp
            };
          } else {
            needsFetch.push(psychicId);
          }
        });
        
        console.log(`⚡ Cache hits: ${Object.keys(statuses).length}, Need DB: ${needsFetch.length}`);
        
        // 2. Fetch missing from DB (async)
        if (needsFetch.length > 0) {
          const Psychic = require('../models/HumanChat/Psychic');
          const psychics = await Psychic.find({ 
            _id: { $in: needsFetch } 
          }).select('_id status lastSeen lastStatusUpdate lastActive').lean();
          
          psychics.forEach(psychic => {
            const cacheData = updatePsychicCache(
              psychic._id, 
              psychic.status || 'offline', 
              psychic.lastSeen, 
              psychic.lastActive
            );
            
            statuses[psychic._id.toString()] = {
              status: cacheData.status,
              lastSeen: cacheData.lastSeen,
              lastActive: cacheData.lastActive,
              lastStatusUpdate: cacheData.timestamp
            };
          });
        }
        
        // 3. Send response immediately (even if some are missing)
        socket.emit('psychic_statuses_response', { statuses });
        
      } catch (error) {
        console.error('Error in get_psychic_statuses:', error);
        // Still send what we have from cache
        const cachedStatuses = {};
        psychicIds.forEach(psychicId => {
          const cached = getPsychicStatusFromCache(psychicId);
          if (cached) {
            cachedStatuses[psychicId] = {
              status: cached.status,
              lastSeen: cached.lastSeen,
              lastActive: cached.lastActive
            };
          }
        });
        socket.emit('psychic_statuses_response', { statuses: cachedStatuses });
      }
    });

    // Heartbeat/ping from psychic - INSTANT UPDATE
    socket.on('psychic_heartbeat', ({ psychicId }) => {
      const { userId, role } = socket.handshake.auth;
      
      if (role === 'psychic' && userId.toString() === psychicId.toString()) {
        // Update cache immediately
        const cacheData = updatePsychicCache(psychicId, 'online');
        
        // Broadcast to subscribers
        const statusData = {
          psychicId,
          status: 'online',
          timestamp: Date.now(),
          lastSeen: cacheData.lastSeen,
          lastActive: cacheData.lastActive
        };
        
        broadcastPsychicStatus(psychicId, statusData);
        
        // Update DB async
        const Psychic = require('../models/HumanChat/Psychic');
        Psychic.findByIdAndUpdate(psychicId, { 
          lastSeen: new Date(),
          lastActive: new Date()
        }).catch(err => console.error('Heartbeat DB error:', err));
      }
    });

    // Join chat room
    socket.on('join_room', (roomName) => {
      if (!socketRooms.get(socket.id).has(roomName)) {
        socket.join(roomName);
        socketRooms.get(socket.id).add(roomName);
        console.log(`👥 ${role} ${userId} joined room: ${roomName}`);
      } else {
        console.log(`ℹ️ ${role} ${userId} already in room: ${roomName}`);
      }
    });

    // Join psychic timer room
    socket.on('join_psychic_timer', ({ psychicId }) => {
      const roomName = `psychic_timer_${psychicId}`;
      if (!socketRooms.get(socket.id).has(roomName)) {
        socket.join(roomName);
        socketRooms.get(socket.id).add(roomName);
        console.log(`⏰ Socket ${socket.id} joined psychic timer room: ${roomName}`);
      }
    });

    // Join user timer room
    socket.on('join_user_timer', ({ userId: targetUserId }) => {
      const roomName = `user_timer_${targetUserId}`;
      if (!socketRooms.get(socket.id).has(roomName)) {
        socket.join(roomName);
        socketRooms.get(socket.id).add(roomName);
        console.log(`⏰ Socket ${socket.id} joined user timer room: ${roomName}`);
      }
    });

    // Join chat request room
    socket.on('join_chat_request', ({ chatRequestId }) => {
      const roomName = `chat_request_${chatRequestId}`;
      if (!socketRooms.get(socket.id).has(roomName)) {
        socket.join(roomName);
        socketRooms.get(socket.id).add(roomName);
        console.log(`📋 Socket ${socket.id} joined chat request room: ${roomName}`);
      }
    });

    socket.on('chat_session_created', ({ chatSession }) => {
      console.log(`🎯 Chat session created: ${chatSession._id}`);
      
      const psychicId = chatSession.psychic._id || chatSession.psychic;
      const psychicRoom = `psychic_${psychicId}`;
      const chatRoom = `chat_${chatSession._id}`;
      
      io.to(psychicRoom).emit('new_chat_session', {
        chatSession,
        timestamp: Date.now()
      });
      
      io.to(chatRoom).emit('session_created', {
        chatSession
      });
      
      console.log(`📢 Notified psychic ${psychicId} about new session`);
    });

    // Join multiple chat rooms
    socket.on('join_chats', (roomNames) => {
      roomNames.forEach(roomName => {
        if (!socketRooms.get(socket.id).has(roomName)) {
          socket.join(roomName);
          socketRooms.get(socket.id).add(roomName);
          console.log(`👥 ${role} ${userId} joined room: ${roomName}`);
        }
      });
    });

    // Leave room
    socket.on('leave_room', (roomName) => {
      socket.leave(roomName);
      socketRooms.get(socket.id).delete(roomName);
      console.log(`👋 ${role} ${userId} left room: ${roomName}`);
    });

    // Typing indicator
    socket.on('typing', ({ chatSessionId, isTyping }) => {
      console.log(`⌨️ ${role} ${userId} typing: ${isTyping} in chat ${chatSessionId}`);
      
      socket.to(`chat_${chatSessionId}`).emit('typing_indicator', {
        chatSessionId,
        userId,
        userRole: role,
        isTyping,
        timestamp: Date.now()
      });
    });

    // Send message
    socket.on('send_message', async (data, callback) => {
      try {
        console.log('📤 send_message received:', {
          chatSessionId: data.chatSessionId,
          senderId: userId,
          senderRole: role,
          messageId: data.message?._id
        });

        const { chatSessionId, message, senderId, senderRole } = data;

        // Validate input
        if (!chatSessionId || !message) {
          console.log('❌ Missing chatSessionId or message');
          if (callback) callback({ success: false, error: 'Missing data' });
          return;
        }

        // IMPORTANT: Check if sender matches current user
        if (senderId.toString() !== userId.toString()) {
          console.log('❌ Sender ID mismatch');
          if (callback) callback({ success: false, error: 'Sender mismatch' });
          return;
        }

        const MessageBox = require('../models/HumanChat/MessageBox');
        const ChatSession = require('../models/HumanChat/HumanChatSession');
        
        // Get the message from database (with proper population)
        const fullMessage = await MessageBox.findById(message._id)
          .populate('sender', 'name firstName lastName username image')
          .populate('receiver', 'name firstName lastName username image')
          .populate({
            path: 'replyTo',
            select: 'content sender senderModel createdAt'
          });

        if (!fullMessage) {
          console.log('❌ Message not found in database:', message._id);
          if (callback) callback({ success: false, error: 'Message not found' });
          return;
        }

        // Get chat session info
        const chatSession = await ChatSession.findById(chatSessionId)
          .populate('user', 'firstName lastName username image')
          .populate('psychic', 'name email image');

        if (!chatSession) {
          console.log(`❌ Chat session ${chatSessionId} not found`);
          if (callback) callback({ success: false, error: 'Chat session not found' });
          return;
        }

        console.log(`📨 Broadcasting message ${message._id} to chat_${chatSessionId}`);
        console.log('Message details:', {
          sender: fullMessage.sender?.name || 'Unknown',
          content: fullMessage.content?.substring(0, 50),
          senderModel: fullMessage.senderModel
        });

        // Emit to both parties
        const chatRoom = `chat_${chatSessionId}`;
        const emitData = {
          message: fullMessage,
          chatSessionId,
          senderId: userId,
          senderRole: role,
          timestamp: Date.now(),
          isPsychicMessage: role === 'psychic'
        };
        
        io.to(chatRoom).emit('new_message', emitData);
        console.log(`✅ Emitted to chat room: ${chatRoom}`);
        
        // Also emit to personal room of the OTHER participant for reliability
        if (role === 'psychic') {
          // Psychic sending to user
          const userRoom = `user_${chatSession.user._id}`;
          io.to(userRoom).emit('new_message', emitData);
          console.log(`✅ Also sent to user room: ${userRoom}`);
        } else {
          // User sending to psychic
          const psychicRoom = `psychic_${chatSession.psychic._id}`;
          io.to(psychicRoom).emit('new_message', emitData);
          console.log(`✅ Also sent to psychic room: ${psychicRoom}`);
        }
        
        // Update unread counts via socket
        if (role === 'psychic') {
          // Psychic sent message, increment user's unread count
          socket.to(`user_${chatSession.user._id}`).emit('unread_count_updated', {
            chatSessionId,
            unreadCount: chatSession.unreadCounts.user + 1
          });
        } else {
          // User sent message, increment psychic's unread count
          socket.to(`psychic_${chatSession.psychic._id}`).emit('unread_count_updated', {
            chatSessionId,
            unreadCount: chatSession.unreadCounts.psychic + 1
          });
        }

        // Send acknowledgement
        if (callback) callback({ success: true, message: 'Message delivered' });

      } catch (error) {
        console.error('❌ Error in send_message handler:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Message sync/replay event
    socket.on('sync_messages', async (data, callback) => {
      try {
        const { chatSessionId, lastMessageId } = data;
        const userId = socket.handshake.auth.userId;
        const role = socket.handshake.auth.role;
        
        console.log(`🔄 Syncing messages for ${chatSessionId}, lastMessageId: ${lastMessageId}`);
        
        const MessageBox = require('../models/HumanChat/MessageBox');
        
        // Build query
        const query = { chatSession: chatSessionId };
        
        // If we have a lastMessageId, get messages after it
        if (lastMessageId) {
          try {
            // Get timestamp of last message
            const lastMessage = await MessageBox.findById(lastMessageId);
            if (lastMessage) {
              query.createdAt = { $gt: lastMessage.createdAt };
            }
          } catch (err) {
            console.log('Could not find last message, fetching all');
          }
        }
        
        // Get recent messages (last 50)
        const messages = await MessageBox.find(query)
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('sender', 'name firstName lastName username image')
          .populate('receiver', 'name firstName lastName username image');
        
        console.log(`📦 Found ${messages.length} messages to sync`);
        
        if (callback) {
          callback({
            success: true,
            messages: messages.reverse(), // Oldest first
            chatSessionId,
            count: messages.length
          });
        }
        
      } catch (error) {
        console.error('Error syncing messages:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Message delivery confirmation
    socket.on('message_received', (data) => {
      const { messageId, chatSessionId } = data;
      console.log(`✓ Message received confirmation: ${messageId}`);
      
      // Notify sender that message was received
      const messageData = { messageId, status: 'delivered', timestamp: Date.now() };
      socket.to(`chat_${chatSessionId}`).emit('message_delivery_status', messageData);
      
      // Also update in database
      const MessageBox = require('../models/HumanChat/MessageBox');
      MessageBox.findByIdAndUpdate(messageId, { 
        status: 'delivered',
        deliveredAt: Date.now()
      }).catch(err => console.error('Update delivery status error:', err));
    });

    socket.on('message_read', (data) => {
      const { messageId, chatSessionId } = data;
      console.log(`✓✓ Message read confirmation: ${messageId}`);
      
      const messageData = { messageId, status: 'read', timestamp: Date.now() };
      socket.to(`chat_${chatSessionId}`).emit('message_read_status', messageData);
      
      // Update in database
      const MessageBox = require('../models/HumanChat/MessageBox');
      MessageBox.findByIdAndUpdate(messageId, { 
        status: 'read',
        readAt: Date.now()
      }).catch(err => console.error('Update read status error:', err));
    });

    // Message status updates
    socket.on('message_delivered', ({ messageId, chatSessionId }) => {
      console.log(`✓ Message delivered: ${messageId}`);
      
      io.to(`chat_${chatSessionId}`).emit('message_status', {
        messageId,
        status: 'delivered',
        userId,
        timestamp: Date.now()
      });
    });

    socket.on('message_read', ({ messageId, chatSessionId }) => {
      console.log(`✓✓ Message read: ${messageId}`);
      
      io.to(`chat_${chatSessionId}`).emit('message_status', {
        messageId,
        status: 'read',
        userId,
        timestamp: Date.now()
      });
    });

    // Timer status update
    socket.on('timer_status_update', ({ requestId, isPaused, remainingSeconds, psychicId, userId }) => {
      console.log(`⏰ Timer status update from ${role} ${userId}:`, { requestId, isPaused, remainingSeconds });
      
      if (psychicId) {
        io.to(`psychic_${psychicId}`).emit('timer_updated', {
          requestId,
          isPaused,
          remainingSeconds,
          updatedBy: role
        });
      }
      
      if (userId) {
        io.to(`user_${userId}`).emit('timer_updated', {
          requestId,
          isPaused,
          remainingSeconds,
          updatedBy: role
        });
      }
      
      io.to(`chat_request_${requestId}`).emit('timer_status', {
        requestId,
        isPaused,
        remainingSeconds,
        updatedBy: role
      });
    });

    // Session started notification
    socket.on('session_started', ({ requestId, chatRequest, psychicId, remainingSeconds }) => {
      console.log(`🚀 Session started event: ${requestId}`);
      
      if (psychicId) {
        io.to(`psychic_${psychicId}`).emit('session_started', {
          requestId,
          chatRequest,
          psychicId,
          remainingSeconds
        });
        
        io.to(`psychic_timer_${psychicId}`).emit('timer_initialized', {
          requestId,
          remainingSeconds,
          psychicId,
          user: chatRequest?.user
        });
      }
      
      if (chatRequest?.user?._id) {
        io.to(`user_${chatRequest.user._id}`).emit('session_started', {
          requestId,
          chatRequest,
          psychicId,
          remainingSeconds
        });
      }
      
      io.to(`chat_request_${requestId}`).emit('session_activated', {
        requestId,
        status: 'active'
      });
    });

    // Request accepted event
    socket.on('request_accepted', ({ requestId, userId, psychicId }) => {
      console.log(`✅ Request accepted: ${requestId}`);
      
      if (userId) {
        io.to(`user_${userId}`).emit('chat_request_accepted', {
          requestId,
          psychicId
        });
      }
      
      if (psychicId) {
        io.to(`psychic_${psychicId}`).emit('chat_request_accepted_for_psychic', {
          requestId,
          userId
        });
      }
    });

    // Request rejected event
    socket.on('request_rejected', ({ requestId, userId, psychicId }) => {
      console.log(`❌ Request rejected: ${requestId}`);
      
      if (userId) {
        io.to(`user_${userId}`).emit('chat_request_rejected', {
          requestId,
          psychicId
        });
      }
    });

    // Get online status
    socket.on('get_online_status', ({ userIds }) => {
      const statuses = {};
      userIds.forEach(id => {
        statuses[id] = connectedUsers.has(id.toString()) ? 'online' : 'offline';
      });
      
      socket.emit('online_status_response', statuses);
    });

    // Check if user is available
    socket.on('check_availability', ({ userId, userModel }) => {
      const socketId = connectedUsers.get(userId.toString());
      const isAvailable = !!socketId;
      
      socket.emit('availability_response', {
        userId,
        userModel,
        isAvailable,
        timestamp: Date.now()
      });
    });

   
    // Error handler
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  // Helper function to format time
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00";
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  // Function to emit timer tick
  const emitTimerTick = (chatRequestId, remainingSeconds, userId, psychicId) => {
    if (!io) return;
    
    const timerData = {
      requestId: chatRequestId,
      remainingSeconds,
      formattedTime: formatTime(remainingSeconds),
      timestamp: Date.now()
    };
    
    if (userId) {
      io.to(`user_${userId}`).emit('timer_tick', timerData);
      io.to(`user_timer_${userId}`).emit('timer_tick', timerData);
    }
    
    if (psychicId) {
      io.to(`psychic_${psychicId}`).emit('timer_tick', timerData);
      io.to(`psychic_timer_${psychicId}`).emit('timer_tick', timerData);
    }
    
    io.to(`chat_request_${chatRequestId}`).emit('timer_tick', timerData);
    
    console.log(`⏰ Timer tick emitted for request ${chatRequestId}: ${remainingSeconds}s`);
  };
  
  // Function to emit timer pause/resume
  const emitTimerStatus = (chatRequestId, isPaused, remainingSeconds, userId, psychicId) => {
    if (!io) return;
    
    const statusData = {
      requestId: chatRequestId,
      isPaused,
      remainingSeconds,
      timestamp: Date.now()
    };
    
    const eventName = isPaused ? 'timer_paused' : 'timer_resumed';
    
    if (userId) {
      io.to(`user_${userId}`).emit(eventName, statusData);
    }
    
    if (psychicId) {
      io.to(`psychic_${psychicId}`).emit(eventName, statusData);
    }
    
    io.to(`chat_request_${chatRequestId}`).emit(eventName, statusData);
    
    console.log(`⏰ Timer ${isPaused ? 'paused' : 'resumed'} for request ${chatRequestId}`);
  };
  
  // Function to emit session ended
  const emitSessionEnded = (chatRequestId, userId, psychicId, reason = 'ended') => {
    if (!io) return;
    
    const endData = {
      requestId: chatRequestId,
      endedAt: new Date(),
      reason,
      timestamp: Date.now()
    };
    
    if (userId) {
      io.to(`user_${userId}`).emit('session_ended', endData);
    }
    
    if (psychicId) {
      io.to(`psychic_${psychicId}`).emit('session_ended', endData);
    }
    
    io.to(`chat_request_${chatRequestId}`).emit('session_ended', endData);
    
    console.log(`🏁 Session ended for request ${chatRequestId}: ${reason}`);
  };

  // Cache cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    psychicStatusCache.forEach((value, key) => {
      if (now - value.timestamp > 300000) { // 5 minutes
        psychicStatusCache.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old cache entries`);
    }
  }, 300000);

  // Make available globally
  global.io = io;
  global.connectedUsers = connectedUsers;
  global.userData = userData;
  global.psychicStatusCache = psychicStatusCache;
  
  // Export helper functions
  module.exports.emitTimerTick = emitTimerTick;
  module.exports.emitTimerStatus = emitTimerStatus;
  module.exports.emitSessionEnded = emitSessionEnded;
  module.exports.updatePsychicCache = updatePsychicCache;
  module.exports.getPsychicStatusFromCache = getPsychicStatusFromCache;
};