import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin only' });
  }
};

export const adminOrOwner = (resourceUserId: any) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?._id;
    const isAdmin = req.user?.role === 'admin';
    
    if (!req.user || !userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    const isOwner = userId.toString() === resourceUserId?.toString();
    
    if (isAdmin || isOwner) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  };};
