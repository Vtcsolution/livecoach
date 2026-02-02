const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const UAParser = require('ua-parser-js');
const { v4: uuidv4 } = require('uuid');
const connectDB = require('./config/db');
const { startCreditDeductionJob, startFreeSessionTimerJob } = require('./jobs/creditDeductionJob');
const timerSocket = require('./socket/timerSocket');

// Load environment variables
require('dotenv').config();
// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'] // Add this for better compatibility
});
timerSocket(io);

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public/images')));



// Middleware
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this for form data

// Visitor tracking middleware
app.use(async (req, res, next) => {
  const parser = new UAParser();
  const ua = req.headers['user-agent'];
  const result = parser.setUA(ua).getResult();

  // Get or set session ID
  let sessionId = req.cookies.sessionId;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  // Skip logging for static or non-relevant routes
  if (req.path.startsWith('/images') || req.path === '/favicon.ico') {
    return next();
  }

  try {
    const Visitor = require('./models/Visitor');
    // Check for existing visitor record in the last 24 hours
    const recentVisit = await Visitor.findOne({
      sessionId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (!recentVisit) {
      const visitorData = {
        sessionId,
        browser: result.browser.name || 'Unknown',
        browserVersion: result.browser.version || 'Unknown',
        os: result.os.name || 'Unknown',
        osVersion: result.os.version || 'Unknown',
        device: result.device.type || 'desktop',
        ip: req.ip,
        path: req.path,
        timestamp: new Date(),
      };
      await Visitor.create(visitorData);
    }
  } catch (err) {
    console.error('Error in visitor tracking middleware:', err);
    // Don't block the request if visitor tracking fails
  }

  next();
});

// Attach io to req for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import your Socket.IO handler (create this file)
const socketHandler = require('./socket/socketHandler');
socketHandler(io);

// Set Socket.IO instance in controllers that need it
const messageController = require('./controllers/HumanChatbot/messageController');
const chatSessionController = require('./controllers/HumanChatbot/chatSessionController');
if (messageController.setSocketIO) {
  messageController.setSocketIO(io);
}
if (chatSessionController.setSocketIO) {
  chatSessionController.setSocketIO(io);
}

// Import and use routes
const userRoutes = require('./routes/userRoutes');
const aiPsychicRoutes = require('./routes/aiPsychicRoutes');
const chatRoutes = require('./routes/chatRoutes');
const formRoutes = require('./routes/formRoutes');
const adminRoutes = require('./routes/adminRoutes');
const geocodeRoute = require('./routes/geocode');
const videothumnail = require('./routes/videoThumbnailRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const timerRoutes = require('./routes/timerRoutes');
const feedback = require('./routes/feedbackRoutes');
const numerologyRouter = require('./routes/numerologyRoutes');
const astrologyRoutes = require('./routes/astrologyRoutes');
const montlyforcast = require('./routes/monthly-forcast');
const lovecompatability = require('./routes/love-compatability');
const translateRoute = require('./routes/translateRoutes');
const messageRoutes = require('./routes/messageRoutes');
const statsRoutes = require('./routes/statsRoutes');
const userReportRoutes = require('./routes/userReportRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const psychicRoutes = require('./routes/HumanChatbot/psychicRoutes');
const chatRoute = require ('./routes/HumanChatbot/chatRoutes')
const psychicChatRoutes = require('./routes/HumanChatbot/psychicChatRoutes');
const ChatRequestRoutes = require ('./routes/PaidTimer/chatRequestRoutes')
const timerService = require('./services/timerService');
const ratingRoutes = require('./routes/HumanChatbot/ratingRoutes');
const admindataRoutes = require ('./routes/HumanChatbot/admindataRoutes')
// API Routes
app.use('/api/human-psychics', psychicRoutes);
app.use("/api/humanchat", chatRoute)
app.use('/api/psychic', psychicChatRoutes);
app.use('/api/chatrequest',ChatRequestRoutes)
app.use('/api/users', userRoutes);
app.use('/api/psychics', aiPsychicRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/form', formRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/geocode', geocodeRoute);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/thumbnails', videothumnail);

app.use('/api', timerRoutes);
app.use('/api', userReportRoutes);
app.use('/api', feedback);
app.use('/api', numerologyRouter);
app.use('/api', astrologyRoutes);
app.use('/api', montlyforcast);
app.use('/api', lovecompatability);
app.use('/api', translateRoute);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admindata', admindataRoutes)
// Basic route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// CONNECT TO DATABASE AND START SERVER
connectDB().then(() => {
  console.log('✅ MongoDB connected successfully');
  
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    
    // Start timer service after server is running
    setTimeout(async () => {
      try {
        await timerService.initialize();
        
        // Start background jobs
        startCreditDeductionJob(io);
        startFreeSessionTimerJob(io);
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
      }
    }, 1000);
  });
}).catch((error) => {
  console.error('❌ Failed to connect to MongoDB:', error);
  process.exit(1);
});