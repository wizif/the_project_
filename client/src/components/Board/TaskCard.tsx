'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { Calendar, User, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import TaskComments to avoid SSR issues
const TaskComments = dynamic(() => import('../comments/TaskComments'), { ssr: false });

interface Props {
  task: Task;
}

export default function TaskCard({ task }: Props) {
  const [showComments, setShowComments] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white border border-gray-200 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-2 text-gray-900 dark:text-white">{task.title}</h4>
          <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>

        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2 dark:text-gray-300">{task.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}

          {task.assignedTo && (
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{task.assignedTo.name}</span>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map((tag, index) => (
              <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded dark:bg-purple-900 dark:text-purple-300">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* COMMENTS BUTTON - THIS IS THE IMPORTANT PART */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 py-2 px-3 rounded transition-colors"
          >
            <MessageSquare size={16} />
            <span>Comments</span>
          </button>
        </div>
      </div>

      {/* COMMENTS MODAL */}
      {showComments && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowComments(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <TaskComments taskId={task._id} onClose={() => setShowComments(false)} />
          </div>
        </div>
      )}
    </>
  );
}
