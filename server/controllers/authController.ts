import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';
import { signToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const loginAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('Please provide username and password', 400);
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      throw new AppError('Invalid username or password', 401);
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid username or password', 401);
    }

    const token = signToken({
      id: admin._id.toString(),
      username: admin.username,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAdmin = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getCurrentAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.admin) {
      throw new AppError('Not authenticated', 401);
    }

    const admin = await Admin.findById(req.admin.id).select('-passwordHash');
    if (!admin) {
      throw new AppError('Admin account not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.admin) {
      throw new AppError('Not authenticated', 401);
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Please provide both current and new password', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      throw new AppError('New password and confirmation do not match', 400);
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      throw new AppError('Admin account not found', 404);
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

