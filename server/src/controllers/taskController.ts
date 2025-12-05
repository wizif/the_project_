import { Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';

// Get all tasks (filtered by project or user)
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, status, assignedTo } = req.query;
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    let query: any = {};

    if (projectId) {
      query.project = projectId;
    }

    if (status) {
      query.status = status;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // ✅ FIX: Non-admin users can see:
    // 1. Tasks assigned to them
    // 2. Tasks in projects they own
    // 3. Tasks in projects where they are team members
    if (!isAdmin) {
      const userProjects = await Project.find({
        $or: [{ owner: userId }, { 'team.user': userId }]
      }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      
      // ✅ FIXED: Allow users to see tasks assigned to them OR tasks in their projects
      query.$or = [
        { assignedTo: userId }, // ✅ Tasks assigned to this user
        { createdBy: userId }, // ✅ Tasks created by this user
        { project: { $in: projectIds } } // ✅ Tasks in their projects
      ];
    }

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get single task
export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email avatar');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Create task
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📝 Creating task with data:', req.body);
    console.log('👤 Current user:', req.user?._id);

    const {
      title,
      description,
      project,
      assignedTo,
      status,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      tags
    } = req.body;

    // Validate required fields
    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    if (!project) {
      res.status(400).json({ message: 'Project is required' });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get task count for ordering
    const taskCount = await Task.countDocuments({
      project,
      status: status || 'todo'
    });

    // Create task
    const taskData: any = {
      title,
      description: description || '',
      project,
      status: status || 'todo',
      priority: priority || 'medium',
      order: taskCount,
      createdBy: req.user._id,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : []
    };

    // Add optional fields only if provided
    if (assignedTo) taskData.assignedTo = assignedTo;
    if (dueDate) taskData.dueDate = new Date(dueDate);
    if (startDate) taskData.startDate = new Date(startDate);
    if (estimatedHours) taskData.estimatedHours = Number(estimatedHours);

    console.log('💾 Saving task with data:', taskData);

    const task = await Task.create(taskData);

    console.log('✅ Task created:', task._id);

    // Populate and return
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTask);
  } catch (error: any) {
    console.error('❌ Create task error:', error);
    res.status(500).json({
      message: error.message || 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update task
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';
    const isAssignee = userId && task.assignedTo && task.assignedTo.toString() === userId.toString();

    // ✅ SPECIAL CASE: Anyone can mark task as user-completed
    const isOnlyMarkingComplete =
      req.body.isUserCompleted !== undefined &&
      Object.keys(req.body).length === 1;

    if (isOnlyMarkingComplete) {
      task.isUserCompleted = req.body.isUserCompleted;
      if (req.body.isUserCompleted) {
        task.userCompletedAt = new Date();
      }
    } else if (isAdmin) {
      // Admin can update everything
      Object.assign(task, req.body);
    } else if (isAssignee) {
      // Assignees can update specific fields
      if (req.body.status !== undefined) task.status = req.body.status;
      if (req.body.actualHours !== undefined) task.actualHours = req.body.actualHours;
      if (req.body.isUserCompleted !== undefined) {
        task.isUserCompleted = req.body.isUserCompleted;
        if (req.body.isUserCompleted) {
          task.userCompletedAt = new Date();
        }
      }
    } else {
      res.status(403).json({ message: 'Not authorized to update this task' });
      return;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    res.json(updatedTask);
  } catch (error: any) {
    console.error('❌ Update task error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update task order (for drag-and-drop)
export const updateTaskOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tasks } = req.body;
    const bulkOps = tasks.map((task: any) => ({
      updateOne: {
        filter: { _id: task.id },
        update: { order: task.order, status: task.status }
      }
    }));

    await Task.bulkWrite(bulkOps);
    res.json({ message: 'Task order updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add comment to task
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    task.comments.push({
      user: req.user?._id,
      text,
      createdAt: new Date()
    } as any);

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('comments.user', 'name email avatar');

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
