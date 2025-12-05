import { Response } from 'express';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Get all projects
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    const query = isAdmin
      ? {}
      : { $or: [{ owner: userId }, { 'team.user': userId }] };

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('team.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get single project
export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('team.user', 'name email');

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ FIXED: Create project with proper team structure
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📝 Creating project with data:', req.body);
    
    const { name, description, team, startDate, endDate, priority } = req.body;

    // ✅ FIX: Transform team array to proper format
    const formattedTeam = team && Array.isArray(team) ? team.map((member: any) => {
      // If member is already an object with user and role, use it
      if (typeof member === 'object' && member.user) {
        return {
          user: member.user,
          role: member.role || 'member'
        };
      }
      // If member is just a string (user ID), format it
      return {
        user: member,
        role: 'member'
      };
    }) : [];

    console.log('✅ Formatted team:', formattedTeam);

    const project = await Project.create({
      name,
      description,
      owner: req.user?._id,
      team: formattedTeam,
      startDate,
      endDate,
      priority: priority || 'medium',
      status: 'active'
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('team.user', 'name email');

    console.log('✅ Project created:', populatedProject);
    res.status(201).json(populatedProject);
  } catch (error: any) {
    console.error('❌ Create project error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ FIXED: Update project with proper team structure
export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, team, status, startDate, endDate, priority } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Check if user is owner or admin
    const userId = req.user?._id;
    const isOwner = userId && project.owner.toString() === userId.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Not authorized to update this project' });
      return;
    }

    project.name = name || project.name;
    project.description = description || project.description;
    
    // ✅ FIX: Format team properly
    if (team) {
      project.team = team.map((member: any) => {
        if (typeof member === 'object' && member.user) {
          return {
            user: member.user,
            role: member.role || 'member'
          };
        }
        return {
          user: member,
          role: 'member'
        };
      });
    }
    
    project.status = status || project.status;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;
    project.priority = priority || project.priority;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('team.user', 'name email');

    res.json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete project - FIXED VERSION
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🗑️ Attempting to delete project:', req.params.id);
    console.log('👤 User:', req.user?._id, 'Role:', req.user?.role);

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    console.log('📁 Project owner:', project.owner);

    const userId = req.user?._id?.toString() || req.user?._id;
    const projectOwnerId = project.owner?.toString();
    const isOwner = userId && projectOwnerId && userId === projectOwnerId;
    const isAdmin = req.user?.role === 'admin';

    console.log('✅ Authorization check:', { userId, projectOwnerId, isOwner, isAdmin });

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Not authorized to delete this project' });
      return;
    }

    await Project.findByIdAndDelete(req.params.id);
    console.log('✅ Project deleted successfully');
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('❌ Delete project error:', error);
    res.status(500).json({ message: error.message });
  }
};
