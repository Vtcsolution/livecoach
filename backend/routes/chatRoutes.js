const express = require("express");
const router = express.Router();
const { chatWithPsychic, getChatMessagesById, getAllUserChats, deleteChatById, getChatHistory, getUserChatDetails } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");
const { adminProtect } = require("../middleware/adminProtect");

// Order matters: specific first, generic last
router.post("/:psychicId", protect, chatWithPsychic);
router.get("/user/:userId", protect, getUserChatDetails);
router.get("/admin/all-chats", adminProtect, getAllUserChats);
router.get("/admin/chat/:chatId", adminProtect, getChatMessagesById);
router.delete("/admin/chat/:chatId", adminProtect, deleteChatById);
router.get("/history/:psychicId", protect, getChatHistory); // Changed from just "/:psychicId"

module.exports = router;