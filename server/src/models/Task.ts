import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  project: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  assignedUsers: mongoose.Types.ObjectId[]; // ✅ NEW: Multiple users
  assignedTeam?: mongoose.Types.ObjectId; // ✅ NEW: Team assignment
  status: 'todo' | 'in-progress' | 'in-review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  order: number;
  isUserCompleted: boolean;
  userCompletedAt?: Date;
  attachments: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
  comments: Array<{
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // ✅ NEW: Multiple user assignment
  assignedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // ✅ NEW: Team assignment
  assignedTeam: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: false
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'in-review', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: false
  },
  estimatedHours: {
    type: Number,
    required: false
  },
  actualHours: {
    type: Number,
    required: false
  },
  tags: {
    type: [String],
    default: []
  },
  order: {
    type: Number,
    default: 0
  },
  isUserCompleted: {
    type: Boolean,
    default: false
  },
  userCompletedAt: {
    type: Date,
    required: false
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true
});

taskSchema.index({ project: 1, status: 1, order: 1 });

export default mongoose.model<ITask>('Task', taskSchema);
