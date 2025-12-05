import { Response } from 'express';
import Comment from '../models/Comment';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Get comments for a task
export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name avatar email')
      .populate('mentions', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(comments);
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a comment
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { text, mentions } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Create comment
    const comment = await Comment.create({
      task: taskId,
      user: userId,
      text: text.trim(),
      mentions: mentions || [],
    });

    // Populate user info
    await comment.populate('user', 'name avatar email');
    await comment.populate('mentions', 'name email');

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a comment
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    await comment.save();

    await comment.populate('user', 'name avatar email');
    await comment.populate('mentions', 'name email');

    res.json(comment);
  } catch (error: any) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a comment
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.user.toString() !== userId?.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
