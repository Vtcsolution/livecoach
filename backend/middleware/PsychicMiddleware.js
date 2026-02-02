// middleware/PsychicMiddleware.js - FIXED VERSION
const jwt = require('jsonwebtoken');
const Psychic = require('../models/HumanChat/Psychic');

const protectPsychic = async (req, res, next) => {
  let token;

  // 1. Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Check cookies (for web browser)
  else if (req.cookies && req.cookies.psychicToken) {
    token = req.cookies.psychicToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token has psychic role
    if (decoded.role !== 'psychic') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type for psychic access'
      });
    }

    // Find psychic
    const psychic = await Psychic.findById(decoded.id).select('-password');
    
    if (!psychic) {
      return res.status(401).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Check if psychic is verified
    if (!psychic.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Psychic account not verified'
      });
    }

    // Attach psychic to request in a consistent way
    req.user = {
      _id: psychic._id,
      id: psychic._id, // Add both _id and id for compatibility
      name: psychic.name,
      email: psychic.email,
      role: 'psychic',
      isVerified: psychic.isVerified
    };

    // Also attach as req.psychic for compatibility
    req.psychic = psychic;

    next();

  } catch (error) {
    console.error('Psychic auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

// Middleware to check if psychic is verified
const requireVerifiedPsychic = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Verified psychic account required'
    });
  }
  next();
};

module.exports = { protectPsychic, requireVerifiedPsychic };