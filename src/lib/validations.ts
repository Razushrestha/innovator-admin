import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: 'Price must be a number' })
     .min(0, 'Price cannot be negative')
  ),
  category: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
});

export type CourseFormData = z.infer<typeof courseSchema>;

export const courseContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  video_url: z.string().url('Invalid video URL').or(z.literal('')).nullable().optional(),
  document_url: z.string().url('Invalid document URL').or(z.literal('')).nullable().optional(),
  course_level: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0),
});

export type CourseContentFormData = z.infer<typeof courseContentSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(255).optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const vendorSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  bio: z.string().max(500).optional(),
  commission_rate: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ invalid_type_error: 'Commission rate must be a number' })
     .min(0).max(100).optional()
  ),
  is_approved: z.boolean().default(false),
});

export type VendorFormData = z.infer<typeof vendorSchema>;

