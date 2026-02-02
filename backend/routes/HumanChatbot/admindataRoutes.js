// routes/admin/adminRoutes.js

const express = require('express');
const router = express.Router();
const { adminProtect } = require('../../middleware/adminProtect');

const {
  getAllChatData,
  getChatById,
  getPsychicDetails,
  getAllPsychics
} = require('../../controllers/HumanChatbot/admindataController');

// ✅ CORRECT ORDER: Specific routes FIRST, parameter routes LAST

// 1. Psychics routes (specific routes)
router.get('/chats/psychics', adminProtect, getAllPsychics);
router.get('/chats/psychics/:id', adminProtect, getPsychicDetails);

// 2. Chats routes (parameter routes LAST)
router.get('/chats/:id', adminProtect, getChatById);
router.get('/chats', adminProtect, getAllChatData);

module.exports = router;