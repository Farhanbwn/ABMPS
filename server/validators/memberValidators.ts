import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const memberIdParamSchema = z
  .object({
    id: z.string().regex(objectIdRegex, 'Invalid Member ID format (must be 24-character hex ObjectId)'),
  })
  .strict();

export const memberSerialParamSchema = z
  .object({
    serialNo: z.string().regex(/^\d+$/, 'Serial number must be a positive integer'),
  })
  .strict();

export const createMemberSchema = z
  .object({
    serialNo: z.coerce.number().int().positive('Serial number must be a positive integer'),
    nameBengali: z.string().trim().min(1, 'Bengali name is required').max(200, 'Name is too long'),
    nameEnglish: z.string().trim().max(200, 'Name is too long').optional().default(''),
    dateOfBirth: z
      .union([z.string().datetime({ offset: true }), z.string(), z.null()])
      .optional()
      .nullable(),
    address: z.string().trim().max(500, 'Address is too long').optional().default(''),
    mobileNo: z
      .string()
      .trim()
      .optional()
      .default('')
      .refine((val) => !val || /^\d{10}$/.test(val), {
        message: 'Mobile number must be exactly 10 digits',
      }),
    gender: z.enum(['Male', 'Female', 'Other']).nullable().optional(),
    joinYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
    membershipStatus: z.enum(['Active', 'Inactive']).optional().default('Active'),
    activeBillId: z.string().trim().max(100).nullable().optional(),
  })
  .strict();

export const updateMemberSchema = z
  .object({
    serialNo: z.coerce.number().int().positive().optional(),
    nameBengali: z.string().trim().min(1).max(200).optional(),
    nameEnglish: z.string().trim().max(200).optional(),
    dateOfBirth: z
      .union([z.string(), z.null()])
      .optional()
      .nullable(),
    address: z.string().trim().max(500).optional(),
    mobileNo: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^\d{10}$/.test(val), {
        message: 'Mobile number must be exactly 10 digits',
      }),
    gender: z.enum(['Male', 'Female', 'Other']).nullable().optional(),
    joinYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
    membershipStatus: z.enum(['Active', 'Inactive']).optional(),
    activeBillId: z.string().trim().max(100).nullable().optional(),
  })
  .strict();

export const memberQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(500).optional().default(25),
    search: z.string().max(100).optional(),
    status: z.string().max(30).optional(),
    gender: z.string().max(30).optional(),
    joinYear: z.coerce.number().int().min(1900).max(2100).optional(),
    membershipYear: z.coerce.number().int().min(1900).max(2100).optional(),
    sortBy: z
      .enum(['serialNo', 'nameEnglish', 'nameBengali', 'joinYear', 'membershipStatus', 'createdAt', 'updatedAt'])
      .optional()
      .default('serialNo'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  })
  .passthrough();
