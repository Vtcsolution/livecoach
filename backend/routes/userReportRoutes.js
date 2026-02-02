// routes/userReportRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  getEmailStats,
  sendUserEmail,
} = require("../controllers/userReportController");

// Admin routes
router.get("/", getAllUsers); // Fetch all users with pagination
router.get("/stats", getEmailStats); // Fetch email statistics
router.get("/:id", getUserById); // Fetch user details by ID
router.post("/send-email", sendUserEmail); // Send email to a specific user

module.exports = router;