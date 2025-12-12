'use client';

import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import api from '@/lib/axios';
import { Task } from '@/types';
import { Plus, Trash2, Calendar, User as UserIcon, AlertCircle, GripVertical, Clipboard, Rocket, Eye, CheckCircle, CheckCheck, MessageSquare, X, Send } from 'lucide-react';
import axios from 'axios';

const ITEM_TYPE = 'TASK';
const taskStatus = ['todo', 'in-progress', 'in-review', 'completed'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const statusLabels: Record<string, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  'completed': 'Completed'
};

const statusConfig: Record<string, any> = {
  'todo': {
    bg: 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
    border: 'border-slate-300 dark:border-slate-600',
    icon: <Clipboard className="h-5 w-5" />
  },
  'in-progress': {
    bg: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
    border: 'border-blue-300 dark:border-blue-600',
    icon: <Rocket className="h-5 w-5" />
  },
  'in-review': {
    bg: 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900',
    border: 'border-amber-300 dark:border-amber-600',
    icon: <Eye className="h-5 w-5" />
  },
  'completed': {
    bg: 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900',
    border: 'border-emerald-300 dark:border-emerald-600',
    icon: <CheckCircle className="h-5 w-5" />
  }
};

interface BoardProps {
  projectId: string;
  onNewTask: () => void;
}

interface TaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onUserMarkDone?: (taskId: string) => void;
  isAdmin: boolean;
}

// ✅ COMMENTS COMPONENT
const TaskComments = ({ taskId, onClose }: { taskId: string; onClose: () => void }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/comments/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(response.data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

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
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await axios.delete(`${API_URL}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-blue-600">
          <h3 className="text-lg font-semibold text-white">Comments ({comments.length})</h3>
          <button onClick={onClose} className="text-white hover:bg-blue-700 rounded p-1">
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No comments yet. Be the first! 💬
            </div>
          ) : (
            comments.map((comment) => {
              const isOwn = comment.user._id === currentUser.id || comment.user._id === currentUser._id;
              return (
                <div key={comment._id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {comment.user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
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
                      <p className="text-sm text-gray-900 dark:text-gray-100">{comment.text}</p>
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 flex items-center gap-1 mt-1 ml-2"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onTaskClick, onDelete, onUserMarkDone, isAdmin }: TaskCardProps) => {
  const [showComments, setShowComments] = useState(false);
  
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: task._id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isAdmin,
  });

  const priorityStyles = {
    low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    medium: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
    high: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700',
    urgent: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    if (onDelete) onDelete(task._id);
  };

  const handleUserMarkDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUserMarkDone) onUserMarkDone(task._id);
  };

  const isCompleted = task.status === 'completed';
  const isUserMarkedDone = task.isUserCompleted && !isCompleted;

  return (
    <>
      <div
        ref={isAdmin ? drag : null}
        onClick={() => onTaskClick?.(task)}
        className={`group relative bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border-2 transition-all duration-200 cursor-pointer ${
          isUserMarkedDone 
            ? 'border-green-400 dark:border-green-500 shadow-lg shadow-green-200 dark:shadow-green-900/50'
            : 'border-gray-200 dark:border-gray-700'
        } ${
          isDragging ? 'opacity-40 scale-95 rotate-2' : 'opacity-100 hover:-translate-y-1 hover:shadow-lg'
        } ${isCompleted ? 'opacity-60' : ''}`}
      >
        {isUserMarkedDone && (
          <div className="absolute -top-2 -right-2 z-10">
            <div className="bg-green-500 text-white rounded-full p-2 shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
              <CheckCheck className="h-4 w-4" />
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="absolute left-2 top-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 transition-opacity">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
        )}

        {isAdmin && (
          <button
            onClick={handleDelete}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-all z-10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 pr-8 ${isCompleted ? 'line-through' : ''}`}>
          {task.title}
        </h4>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${priorityStyles[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          {task.assignedTo && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {task.assignedTo.name.split(' ')[0]}
              </span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* ✅ COMMENTS BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(true);
          }}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Comments</span>
        </button>

        {!isAdmin && !isCompleted && !isUserMarkedDone && onUserMarkDone && (
          <button
            onClick={handleUserMarkDone}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark as Done</span>
          </button>
        )}

        {!isAdmin && isUserMarkedDone && (
          <div className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium border-2 border-green-300 dark:border-green-600">
            <CheckCheck className="h-4 w-4 animate-pulse" />
            <span>Waiting for Admin Review</span>
          </div>
        )}

        {isAdmin && isUserMarkedDone && (
          <div className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-semibold border-2 border-green-400 dark:border-green-500">
            <CheckCheck className="h-4 w-4" />
            <span>✓ User Completed - Ready to Move</span>
          </div>
        )}

        {isCompleted && (
          <div className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            <span>Completed</span>
          </div>
        )}
      </div>

      {/* ✅ COMMENTS MODAL */}
      {showComments && <TaskComments taskId={task._id} onClose={() => setShowComments(false)} />}
    </>
  );
};

interface ColumnProps {
  status: string;
  tasks: Task[];
  moveTask: (taskId: string, toStatus: string) => void;
  onNewTask: () => void;
  onTaskClick?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onUserMarkDone?: (taskId: string) => void;
  isAdmin: boolean;
}

const TaskColumn = ({ status, tasks, moveTask, onNewTask, onTaskClick, onDelete, onUserMarkDone, isAdmin }: ColumnProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: string; status: string }) => {
      if (item.status !== status) {
        moveTask(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    canDrop: () => isAdmin,
  });

  const config = statusConfig[status];
  const userCompletedCount = tasks.filter(t => t.isUserCompleted && t.status !== 'completed').length;

  return (
    <div
      ref={isAdmin ? drop : null}
      className={`flex-1 min-w-[280px] bg-gradient-to-br ${config.bg} rounded-xl p-4 border-2 ${config.border} transition-all ${
        isOver && isAdmin ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {config.icon}
          <h3 className="font-bold text-gray-900 dark:text-white">
            {statusLabels[status]}
          </h3>
          {isAdmin && userCompletedCount > 0 && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {userCompletedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {tasks.length}
          </span>
          {isAdmin && status === 'todo' && (
            <button
              onClick={onNewTask}
              className="p-1.5 rounded-lg bg-white dark:bg-gray-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 min-h-[200px]">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onTaskClick={onTaskClick}
            onDelete={onDelete}
            onUserMarkDone={onUserMarkDone}
            isAdmin={isAdmin}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            {config.icon}
            <p className="mt-2 text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function KanbanBoard({ projectId, onNewTask }: BoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(data);
      setError('');
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (taskId: string, toStatus: string) => {
    if (currentUser?.role !== 'admin') {
      return;
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === taskId ? { ...task, status: toStatus as any, isUserCompleted: false } : task
      )
    );

    try {
      await api.put(`/tasks/${taskId}`, { status: toStatus, isUserCompleted: false });
    } catch (error: any) {
      console.error('Error updating task:', error);
      fetchTasks();
    }
  };

  const handleUserMarkDone = async (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === taskId ? { ...task, isUserCompleted: true, userCompletedAt: new Date().toISOString() } : task
      )
    );

    try {
      const response = await api.put(`/tasks/${taskId}`, { 
        isUserCompleted: true
      });
      
      console.log('✅ Task marked as done successfully:', response.data);
      
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? response.data : task
        )
      );
    } catch (error: any) {
      console.error('❌ Error marking task as done:', error);
      
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? { ...task, isUserCompleted: false, userCompletedAt: undefined } : task
        )
      );
      
      const errorMessage = error.response?.data?.message || 'Unable to mark task. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error: any) {
      console.error('Error deleting task:', error);
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const isAdmin = currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        Loading tasks...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            moveTask={moveTask}
            onNewTask={onNewTask}
            onDelete={handleDeleteTask}
            onUserMarkDone={handleUserMarkDone}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </DndProvider>
  );
}
