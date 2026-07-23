import { Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from './auth';

interface AuditOptions {
  action: string;
  entity: 'user' | 'project' | 'task' | 'team';
  entityId?: string;
  changes?: any;
  metadata?: Record<string, any>;
}

export const logAudit = async (
  req: AuthRequest,
  options: AuditOptions
): Promise<void> => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      changes: options.changes,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: options.metadata
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - we don't want audit logging to break the app
  }
};
 
// Middleware wrapper for automatic logging
export const auditMiddleware = (
  action: string,
  entity: 'user' | 'project' | 'task' | 'team'
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.send;

    res.send = function(data: any) {
      // Only log on success
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || req.body._id;
        logAudit(req, {
          action,
          entity,
          entityId,
          changes: req.body,
          metadata: { method: req.method, path: req.path }
        });
      }
      return originalSend.call(this, data);
    };

    next();
  };
};
