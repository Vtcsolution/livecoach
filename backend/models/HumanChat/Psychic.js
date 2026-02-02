const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const psychicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  ratePerMin: {
    type: Number,
    required: true,
  },
  bio: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'Human Psychic'
  },
  abilities: {
    type: [String],
    default: []
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  languages: {
    type: [String],
    default: ['English']
  },
  experience: {
    type: Number,
    default: 0
  },
  specialization: {
    type: String,
    default: ''
  },
  // Status tracking
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // For session tracking
  currentSessions: {
    type: Number,
    default: 0
  },
  maxSessions: {
    type: Number,
    default: 1
  },
  availability: {
    type: Boolean,
    default: true
  },
  responseTime: {
    type: Number,
    default: 5
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Store active session IDs for reference
  activeSessionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRequest'
  }]
}, {
  timestamps: true,
});

psychicSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

psychicSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for formatted rating display
psychicSchema.virtual('ratingDisplay').get(function() {
  if (this.totalRatings === 0) return 'No ratings yet';
  return `${this.averageRating.toFixed(1)} (${this.totalRatings} reviews)`;
});

// Virtual for online status with logic


// Method to update rating stats
psychicSchema.methods.updateRatingStats = async function() {
  const Rating = require('./Rating');
  
  const stats = await Rating.aggregate([
    { $match: { psychic: this._id } },
    { $group: {
        _id: '$psychic',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
    }}
  ]);
  
  if (stats[0]) {
    this.averageRating = stats[0].averageRating || 0;
    this.totalRatings = stats[0].totalRatings || 0;
    await this.save();
  }
  
  return {
    averageRating: this.averageRating,
    totalRatings: this.totalRatings
  };
};

const Psychic = mongoose.model('Psychic', psychicSchema);

module.exports = Psychic;