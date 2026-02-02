// models/NumerologyReport.js
const mongoose = require("mongoose");

const numerologyReportSchema = new mongoose.Schema({
  userReportModalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserReportModal",
    required: true,
  },
  numbers: {
    lifepath: {
      number: { type: Number, required: true },
      description: { type: String, required: true },
    },
    expression: {
      number: { type: Number, required: true },
      description: { type: String, required: true },
    },
    soulurge: {
      number: { type: Number, required: true },
      description: { type: String, required: true },
    },
    personality: {
      number: { type: Number, required: true },
      description: { type: String, required: true },
    },
  },
  narrative: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("NumerologyReport", numerologyReportSchema);