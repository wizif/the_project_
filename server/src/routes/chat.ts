import { Router } from 'express';
import {
  getConversation,
  getAllConversations,
  markAsRead,
  getUnreadCount,
} from '../controllers/chatController';
import { protect } from '../middleware/auth'; // ✅ Changed from 'auth' to 'protect'

const router = Router();

// All routes require authentication
router.use(protect); // ✅ Using 'protect' instead of 'auth'

// Get conversation with specific user
router.get('/conversation/:userId', getConversation);

// Get all conversations
router.get('/conversations', getAllConversations);

// Mark messages as read
router.put('/read/:userId', markAsRead);

// Get unread count
router.get('/unread-count', getUnreadCount);

export default router;
