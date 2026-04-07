import { z } from 'zod';

export const monthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');

export const employeeCreateSchema = z.object({
  empId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  department: z.string().trim().optional().default(''),
});

export const employeeUpdateSchema = employeeCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const monthlyRecordSchema = z.object({
  employeeId: z.string().min(1),
  monthKey: monthKeySchema,
  totalWorkingDays: z.number().int().min(0).max(31),
  leaveDays: z.number().int().min(0).max(31).default(0),
  downtimeMin: z.number().int().min(0).default(0),
  processQuality: z.string().trim().optional().default(''),
  crossTraining: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
});

export const monthlyRecordUpdateSchema = monthlyRecordSchema.partial().extend({
  employeeId: z.string().min(1).optional(),
  monthKey: monthKeySchema.optional(),
});

export const dailyEntrySchema = z.object({
  monthlyRecordId: z.string().min(1).optional(),
  employeeId: z.string().min(1).optional(),
  monthKey: monthKeySchema.optional(),
  entryDate: z.string().date(),
  productivity: z.number().int().min(0).max(300),
  entryType: z.enum(['NORMAL', 'LEAVE', 'BHF']),
  note: z.string().trim().optional().default(''),
}).superRefine((data, context) => {
  if (data.monthlyRecordId) {
    return;
  }

  if (!data.employeeId || !data.monthKey) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['monthlyRecordId'],
      message: 'Provide monthlyRecordId, or employeeId + monthKey.',
    });
  }
});

export const dailyEntryUpdateSchema = z.object({
  monthlyRecordId: z.string().min(1).optional(),
  entryDate: z.string().date().optional(),
  productivity: z.number().int().min(0).max(300).optional(),
  entryType: z.enum(['NORMAL', 'LEAVE', 'BHF']).optional(),
  note: z.string().trim().optional(),
});
