import { z } from 'zod';
import type { AdminOrder } from '@/types/admin-order';

/**
 * Validation Schemas for Admin Order Editing
 * Project: Amuthavalli Crackers
 * Reference: docs/admin-orders-architecture.md
 */

export const UpdateAdminOrderItemSchema = z.object({
  id: z.string().uuid('Invalid order item ID'),
  quantity: z
    .number({ error: 'Quantity must be a valid number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(1000, 'Quantity cannot exceed 1,000 units'),
  unit_price: z
    .number({ error: 'Rate must be a valid number' })
    .min(0.01, 'Rate must be greater than zero')
    .max(1000000, 'Rate exceeds maximum allowed value'),
});

export const UpdateAdminOrderSchema = z.object({
  customer_name: z
    .string({ error: 'Customer name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  customer_phone: z
    .string({ error: 'Phone number is required' })
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  customer_address: z
    .string({ error: 'Address is required' })
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters'),
  customer_city: z
    .string()
    .trim()
    .max(100, 'City must not exceed 100 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  customer_pincode: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^\d{6}$/.test(val),
      'PIN code must be a valid 6-digit number'
    )
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  items: z
    .array(UpdateAdminOrderItemSchema)
    .min(1, 'Order must contain at least one item'),
});

export type UpdateAdminOrderItemInput = z.infer<typeof UpdateAdminOrderItemSchema>;
export type UpdateAdminOrderInput = z.infer<typeof UpdateAdminOrderSchema>;

export interface UpdateAdminOrderResult {
  success: boolean;
  message?: string;
  order?: AdminOrder;
}
