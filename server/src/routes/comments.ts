import { Router } from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { protect } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// Get comments for a task
router.get('/task/:taskId', getComments);

// Create a comment
router.post('/task/:taskId', createComment);

// Update a comment
router.put('/:commentId', updateComment);

// Delete a comment
router.delete('/:commentId', deleteComment);

export default router;
