import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  task: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  mentions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task is required'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fast queries
commentSchema.index({ task: 1, createdAt: -1 });

export default mongoose.model<IComment>('Comment', commentSchema);
