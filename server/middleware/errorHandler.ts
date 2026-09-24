import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  const isProduction = process.env.NODE_ENV === 'production';

  // Always log 500 server errors on the server for diagnostics
  if (statusCode >= 500) {
    console.error('[Server Error]:', err);
  }

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
    message = 'Cross-Origin Request Blocked: Origin is not permitted.';
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'serialNo') {
      message = `Member with Serial No. ${err.keyValue.serialNo} already exists.`;
    } else if (field === 'memberId' || (err.keyPattern && err.keyPattern.membershipYear)) {
      message = 'A renewal record already exists for this member in the specified year.';
    } else {
      message = `Duplicate field value entered: ${field}.`;
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val: any) => val.message);
    message = messages.join('. ');
  }

  // Handle CastError (invalid ObjectId, number, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for parameter: ${err.path}`;
  }

  // In production, mask unexpected 500 errors to prevent information leakage
  if (statusCode === 500 && isProduction && !(err instanceof AppError)) {
    message = 'An unexpected internal server error occurred.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
