import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const renewalIdParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, 'Invalid Renewal ID format (must be 24-character hex ObjectId)'),
  })
  .strict();

export const renewalMemberParamSchema = z
  .object({
    memberId: z.string().regex(objectIdRegex, 'Invalid Member ID format (must be 24-character hex ObjectId)'),
  })
  .strict();

export const renewalYearParamSchema = z
  .object({
    year: z.coerce.number().int().min(1900).max(2100, 'Invalid year'),
  })
  .strict();

export const createRenewalSchema = z
  .object({
    memberId: z.string().regex(objectIdRegex, 'Invalid Member ID format'),
    membershipYear: z.coerce.number().int().min(1900).max(2100, 'Invalid membership renewal year'),
    billId: z.string().trim().min(1, 'Bill ID is required').max(100, 'Bill ID too long'),
    renewalDate: z.union([z.string(), z.null()]).optional(),
    status: z.enum(['Active', 'Inactive']).optional().default('Active'),
    notes: z.string().trim().max(500, 'Notes too long').optional().default(''),
  })
  .strict();

export const updateRenewalSchema = z
  .object({
    billId: z.string().trim().min(1).max(100).optional(),
    renewalDate: z.union([z.string(), z.null()]).optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export const renewalQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(25),
    year: z.coerce.number().int().min(1900).max(2100).optional(),
    status: z.string().max(30).optional(),
    search: z.string().max(100).optional(),
  })
  .passthrough();
