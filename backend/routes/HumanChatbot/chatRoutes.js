// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/HumanChatbot/messageController');
const chatSessionController = require('../../controllers/HumanChatbot/chatSessionController');
const { protect } = require('../../middleware/auth');
const {protectPsychic} = require('../../middleware/PsychicMiddleware')
// Chat Session Routes
router.post('/sessions', protect, chatSessionController.createChatSession);
router.get('/sessions', protect, chatSessionController.getUserChats);
router.get('/sessions/search', protect, chatSessionController.searchParticipants);
router.get('/sessions/:chatSessionId', protect, chatSessionController.getChatSession);
router.put('/sessions/:chatSessionId/status', protect, chatSessionController.updateChatStatus);
router.get("/sessions/check/:psychicId", protect, chatSessionController.checkChatSession);
router.get("/psychic/sessions", protectPsychic, chatSessionController.getPsychicChats);

// Message Routes
router.post('/messages', protect, messageController.sendMessage);
router.get('/messages/:chatSessionId', protect, messageController.getMessages);
router.post('/messages/:messageId/react', protect, messageController.reactToMessage);
router.delete('/messages/:messageId', protect, messageController.deleteMessage);
router.put('/messages/:chatSessionId/read', protect, messageController.markAsRead);
router.get('/messages/unread/count', protect, messageController.getUnreadCount);

module.exports = router;