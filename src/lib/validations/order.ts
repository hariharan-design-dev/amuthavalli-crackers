import { z } from 'zod';

/**
 * Validation Schemas for Guest Checkout and Order Placement
 * Phase: Phase 6B — API / Data Layer Implementation
 * Reference: docs/phase-6-api-data-layer-architecture.md
 */

export const GuestCustomerSchema = z.object({
  name: z
    .string({
      error: 'Name is required',
    })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  mobile: z
    .string({
      error: 'Mobile number is required',
    })
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  address: z
    .string({
      error: 'Address is required',
    })
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters'),
  city: z
    .string({
      error: 'City is required',
    })
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters'),
  pincode: z
    .string({
      error: 'PIN code is required',
    })
    .trim()
    .regex(/^\d{6}$/, 'Must be a valid 6-digit Indian postal PIN code'),
});

export const GuestOrderItemSchema = z.object({
  productId: z
    .string({
      error: 'Product ID is required',
    })
    .uuid('Invalid product identifier format'),
  quantity: z
    .number({
      error: 'Quantity must be a valid number',
    })
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than zero')
    .max(1000, 'Quantity cannot exceed 1,000 units per item'),
});

/**
 * HTML/XML-like tag structure detection pattern.
 * Rejects markup tags (<tag>, </tag>, <img ...>, <script...>, <!-- ... -->, etc.)
 * while allowing normal customer text, punctuation, symbols, Tamil/Unicode, emojis,
 * and markdown asterisks.
 */
const HTML_TAG_REGEX = /<\/?\s*[a-zA-Z][^>]*>|<![^>]*>|<\?[^>]*\?>/;

export const GuestOrderSchema = z.object({
  idempotencyKey: z
    .string({
      error: 'Idempotency key is required',
    })
    .uuid('Invalid idempotency key format'),
  customer: GuestCustomerSchema,
  items: z
    .array(GuestOrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Order notes cannot exceed 1,000 characters')
    .refine(
      (val) => !HTML_TAG_REGEX.test(val),
      'Order notes must be plain text and cannot contain HTML or markup tags'
    )
    .transform((val) => (val === '' ? null : val))
    .nullish(),
});

export type GuestCustomerInput = z.infer<typeof GuestCustomerSchema>;
export type GuestOrderItemInput = z.infer<typeof GuestOrderItemSchema>;
export type GuestOrderInput = z.infer<typeof GuestOrderSchema>;

