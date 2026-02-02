// models/HumanChat/MessageBox.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Reference to the chat room/session - CHANGED TO HumanChatSession
  chatSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HumanChatSession', // Changed from 'ChatSession'
    required: true,
    index: true
  },
  
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  
  // Dynamic reference to either User or Psychic model
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Psychic']
  },
  
  // Receiver information
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'receiverModel'
  },
  
  // Dynamic reference to either User or Psychic model
  receiverModel: {
    type: String,
    required: true,
    enum: ['User', 'Psychic']
  },
  
  // Message content
  content: {
    type: String,
    trim: true,
    required: function() {
      return this.messageType === 'text';
    }
  },
  
  // Message type for handling different content
  messageType: {
    type: String,
    enum: ['text', 'emoji', 'image', 'file', 'system'],
    default: 'text'
  },
  
  // File URL if message contains image/file
  mediaUrl: {
    type: String,
    default: null
  },
  
  // File metadata
  mediaType: {
    type: String,
    default: null
  },
  
  // File size in bytes
  fileSize: {
    type: Number,
    default: null
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Read timestamp
  readAt: {
    type: Date,
    default: null
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // For emoji reactions
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reactions.userModel'
    },
    userModel: {
      type: String,
      enum: ['User', 'Psychic']
    },
    emoji: {
      type: String,
      required: true
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // For replying to specific messages
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Delete status (for soft delete)
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Deleted for specific users (for selective delete)
  deletedFor: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'deletedFor.userModel'
    },
    userModel: {
      type: String,
      enum: ['User', 'Psychic']
    }
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
messageSchema.index({ chatSession: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

const MessageBox = mongoose.model('MessageBox', messageSchema);

module.exports = MessageBox;