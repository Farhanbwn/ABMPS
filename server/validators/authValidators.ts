import { z } from 'zod';

export const loginSchema = z
  .object({
    username: z
      .string({ required_error: 'Username is required' })
      .trim()
      .min(1, 'Username is required')
      .max(50, 'Username cannot exceed 50 characters'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required')
      .max(128, 'Password cannot exceed 128 characters'),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required')
      .max(128, 'Password too long'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters long')
      .max(128, 'Password cannot exceed 128 characters'),
    confirmPassword: z.string().max(128).optional(),
  })
  .strict()
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    {
      message: 'New password and confirmation do not match',
      path: ['confirmPassword'],
    }
  );
