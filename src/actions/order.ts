'use server';

/**
 * Server Action: Guest Order Placement
 * Phase: Phase 6B — API / Data Layer Implementation
 * Authoritative Architecture Source: docs/phase-6-api-data-layer-architecture.md
 *
 * Implements the locked server-authoritative guest order pipeline:
 * - Server-side validation via Zod
 * - Verification of product availability and authoritative selling rates
 * - Authoritative server-side price and total recalculation (client prices discarded)
 * - Verification against business_settings.min_order_value
 * - Invocation of the atomic PostgreSQL transaction function (create_guest_order)
 *   via the privileged Supabase Service Role client
 * - Sanitized customer-safe response model
 */

import { GuestOrderSchema } from '@/lib/validations/order';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { OrderActionResult, SafeOrderResult } from '@/types/order';

export async function submitGuestOrder(input: unknown): Promise<OrderActionResult> {
  // 1. Validate incoming payload structure and customer fields
  const parseResult = GuestOrderSchema.safeParse(input);
  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten().fieldErrors;
    const details: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) details[key] = value;
    }
    return {
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Please review your contact and order details and try again.',
      details,
    };
  }

  const payload = parseResult.data;

  try {
    // 2. Server-side normalization: Merge duplicate product IDs by summing quantities
    const mergedItemMap = new Map<string, number>();
    for (const item of payload.items) {
      const currentQty = mergedItemMap.get(item.productId) ?? 0;
      mergedItemMap.set(item.productId, currentQty + item.quantity);
    }

    const normalizedItems: Array<{ productId: string; quantity: number }> = [];
    for (const [productId, quantity] of mergedItemMap.entries()) {
      // 3. Post-merge quantity validation: Maximum 1,000 units per unique product
      if (quantity > 1000) {
        return {
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Total combined quantity for a single product cannot exceed 1,000 units.',
        };
      }
      normalizedItems.push({ productId, quantity });
    }

    // 4. Initialize privileged server-side Supabase client
    const supabase = createServiceRoleClient();

    // 5. Extract unique product IDs and query catalog for trusted rates & availability
    const uniqueProductIds = normalizedItems.map((item) => item.productId);

    const { data: dbProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, tamil_name, selling_rate, is_available')
      .in('id', uniqueProductIds);

    if (productsError || !dbProducts) {
      console.error('[submitGuestOrder] Product catalog query error:', productsError);
      return {
        success: false,
        code: 'ORDER_FAILED',
        message: 'Unable to verify items in the catalog. Please try again.',
      };
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 6. Verify all normalized unique items exist and are currently available
    for (const item of normalizedItems) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return {
          success: false,
          code: 'PRODUCT_NOT_FOUND',
          message: 'One or more items in your cart are no longer available.',
        };
      }

      if (!dbProduct.is_available) {
        return {
          success: false,
          code: 'PRODUCT_UNAVAILABLE',
          message: `Item "${dbProduct.name}" is currently out of stock or unavailable.`,
        };
      }
    }

    // 7. Server-side authoritative calculation of totals using merged quantities
    let calculatedTotalQuantity = 0;
    let calculatedTotalAmount = 0;

    const transactionItems = normalizedItems.map((item) => {
      const dbProduct = productMap.get(item.productId)!;
      const unitPrice = Number(dbProduct.selling_rate);
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));

      calculatedTotalQuantity += item.quantity;
      calculatedTotalAmount = Number((calculatedTotalAmount + lineTotal).toFixed(2));

      return {
        product_id: item.productId,
        product_name: dbProduct.name,
        tamil_name: dbProduct.tamil_name ?? null,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
      };
    });

    // 8. Fetch business settings to enforce min_order_value and assemble contact info
    const { data: businessSettings, error: settingsError } = await supabase
      .from('business_settings')
      .select('min_order_value, whatsapp_number, reach_us_number, gpay_upi_numbers, gpay_qr_code_url, business_name, business_mobile, business_address')
      .eq('id', 1)
      .single();

    if (settingsError || !businessSettings) {
      console.error('[submitGuestOrder] Business settings query error:', settingsError);
      return {
        success: false,
        code: 'ORDER_FAILED',
        message: 'Unable to retrieve store configuration. Please try again.',
      };
    }

    const minOrderValue = Number(businessSettings.min_order_value ?? 0);
    if (calculatedTotalAmount < minOrderValue) {
      return {
        success: false,
        code: 'MIN_ORDER_NOT_MET',
        message: `Minimum order value is ₹${minOrderValue.toFixed(2)}. Your current order total is ₹${calculatedTotalAmount.toFixed(2)}.`,
      };
    }

    // 9. Invoke the atomic PostgreSQL transaction function via RPC
    const { data: orderData, error: rpcError } = await supabase.rpc('create_guest_order', {
      p_idempotency_key: payload.idempotencyKey,
      p_customer_name: payload.customer.name,
      p_customer_mobile: payload.customer.mobile,
      p_customer_address: payload.customer.address,
      p_customer_city: payload.customer.city,
      p_customer_pincode: payload.customer.pincode,
      p_total_quantity: calculatedTotalQuantity,
      p_total_amount: calculatedTotalAmount,
      p_items: transactionItems,
      p_notes: payload.notes || null,
    });

    if (rpcError || !orderData) {
      console.error('[submitGuestOrder] create_guest_order RPC error:', rpcError);
      return {
        success: false,
        code: 'ORDER_FAILED',
        message: 'Unable to complete order placement at this time. Please try again.',
      };
    }

    // 10. Construct sanitized safe customer response
    const safeResult: SafeOrderResult = {
      success: true,
      order: {
        id: orderData.id,
        orderNumber: orderData.order_number,
        invoiceToken: orderData.invoice_token || orderData.id,
        createdAt: orderData.created_at,
        status: orderData.status,
        customer: {
          name: orderData.customer.name,
          phone: orderData.customer.phone,
          address: orderData.customer.address,
          city: orderData.customer.city,
          pincode: orderData.customer.pincode,
        },
        items: (orderData.items || []).map((item: {
          product_name: string;
          tamil_name?: string | null;
          quantity: number;
          unit_price: number | string;
          total_price: number | string;
        }) => ({
          productName: item.product_name,
          tamilName: item.tamil_name ?? null,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
        })),
        totalQuantity: orderData.total_quantity,
        totalAmount: Number(orderData.total_amount),
        notes: orderData.notes ?? null,
      },
      business: {
        whatsappNumber: businessSettings.whatsapp_number,
        reachUsNumber: businessSettings.reach_us_number || undefined,
        gpayUpiNumbers: businessSettings.gpay_upi_numbers || [],
        gpayQrCodeUrl: businessSettings.gpay_qr_code_url,
        businessName: businessSettings.business_name || undefined,
        businessMobile: businessSettings.business_mobile || undefined,
        businessAddress: businessSettings.business_address || undefined,
      },
    };

    return safeResult;
  } catch (error) {
    console.error('[submitGuestOrder] Unexpected server exception:', error);
    return {
      success: false,
      code: 'ORDER_FAILED',
      message: 'An unexpected error occurred while processing your order. Please try again.',
    };
  }
}
