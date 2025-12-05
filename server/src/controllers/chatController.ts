import { Response } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth'; // ✅ Import AuthRequest

// Get conversation between two users
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id || req.user?._id; // ✅ Handle both id and _id

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Fetch messages between current user and specified user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'name avatar email')
      .populate('receiver', 'name avatar email')
      .sort({ createdAt: 1 })
      .limit(100); // Limit to last 100 messages

    res.json(messages);
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all conversations for current user
export const getAllConversations = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get unique users the current user has chatted with
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId.toString()) },
            { receiver: new mongoose.Types.ObjectId(currentUserId.toString()) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(currentUserId.toString())] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', new mongoose.Types.ObjectId(currentUserId.toString())] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            avatar: '$user.avatar',
            role: '$user.role',
          },
          lastMessage: 1,
          unreadCount: 1,
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    res.json(messages);
  } catch (error: any) {
    console.error('Get all conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark messages as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id || req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get unread message count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const count = await Message.countDocuments({
      receiver: currentUserId,
      read: false,
    });

    res.json({ count });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
