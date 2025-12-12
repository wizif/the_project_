'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Edit2, X } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '@/contexts/SocketContext';

interface Comment {
  _id: string;
  task: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  text: string;
  mentions: any[];
  createdAt: string;
  updatedAt: string;
}

interface TaskCommentsProps {
  taskId: string;
  onClose?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function TaskComments({ taskId, onClose }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Load comments
  const loadComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/comments/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(response.data);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    }
  };

  useEffect(() => {
    loadComments();
  }, [taskId]);

  // Socket.io - Listen for new comments
  useEffect(() => {
    if (!socket) return;

    socket.on('commentAdded', (data: { taskId: string; comment: Comment }) => {
      if (data.taskId === taskId) {
        setComments((prev) => [data.comment, ...prev]);
      }
    });

    return () => {
      socket.off('commentAdded');
    };
  }, [socket, taskId]);

  // Scroll to bottom
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/comments/task/${taskId}`,
        { text: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Emit socket event
      if (socket) {
        socket.emit('newComment', {
          taskId,
          comment: response.data,
        });
      }

      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editText.trim() || loading) return;

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/comments/${commentId}`,
        { text: editText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(
        comments.map((c) => (c._id === commentId ? response.data : c))
      );
      setEditingId(null);
      setEditText('');
    } catch (error: any) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment');
    } finally {
      setLoading(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await axios.delete(`${API_URL}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments(comments.filter((c) => c._id !== commentId));
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  // Start editing
  const startEditing = (comment: Comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.user._id === currentUser.id || comment.user._id === currentUser._id;

            return (
              <div key={comment._id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.user.avatar ? (
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {comment.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {editingId === comment._id ? (
                      /* Edit Mode */
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditComment(comment._id)}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:bg-gray-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white text-sm rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isOwn && editingId !== comment._id && (
                    <div className="flex gap-3 mt-1 ml-2">
                      <button
                        onClick={() => startEditing(comment)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            rows={2}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || loading}
            className="self-end px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
