import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:userId', getMessages);
router.post('/messages', sendMessage);

export default router;
