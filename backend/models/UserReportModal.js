// models/UserReportModal.js
const mongoose = require("mongoose");

const userReportModalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    match: [/^[a-zA-Z\s]*$/, "Name must contain only letters and spaces"],
  },
  dob: {
    type: Date,
    required: [true, "Date of birth is required"],
  },
  birthTime: {
    type: String,
    trim: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Birth time must be in HH:MM (24-hour) format"],
    required: false,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserReportModal", userReportModalSchema);