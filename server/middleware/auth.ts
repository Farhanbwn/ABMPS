import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { Admin } from '../models/Admin';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
  };
}

export const authenticateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Access denied.',
      });
      return;
    }

    const decoded = verifyToken(token);
    const admin = await Admin.findById(decoded.id).select('-passwordHash');

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid session or admin account not found.',
      });
      return;
    }

    req.admin = {
      id: admin._id.toString(),
      username: admin.username,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};
