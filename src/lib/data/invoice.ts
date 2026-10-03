'use server';

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { BusinessSettings } from '@/types/database';

export interface InvoiceOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceCustomer {
  name: string;
  phone: string;
  address: string;
  city: string | null;
  pincode: string | null;
}

export interface InvoiceData {
  orderId: string;
  orderNumber: string;
  invoiceToken: string;
  createdAt: string;
  status: string;
  totalQuantity: number;
  totalAmount: number;
  notes: string | null;
  customer: InvoiceCustomer;
  items: InvoiceOrderItem[];
  business: BusinessSettings;
}

// UUID validation regex to reject malformed input before database query
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Retrieves authoritative invoice details by secure invoice token.
 * Executes server-side via Supabase Service Role client.
 * Returns null if token is invalid or order not found.
 */
export async function getInvoiceByToken(token: string): Promise<InvoiceData | null> {
  if (!token || !UUID_REGEX.test(token.trim())) {
    return null;
  }

  const cleanToken = token.trim().toLowerCase();

  try {
    const supabase = createServiceRoleClient();

    // 1. Fetch order by invoice_token
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, invoice_token, customer_name, customer_phone, customer_address, customer_city, customer_pincode, status, total_quantity, total_amount, notes, created_at')
      .eq('invoice_token', cleanToken)
      .single();

    if (orderError || !orderRow) {
      return null;
    }

    // 2. Fetch order items and business settings concurrently
    const [itemsRes, businessRes] = await Promise.all([
      supabase
        .from('order_items')
        .select('id, product_name, quantity, unit_price, total_price')
        .eq('order_id', orderRow.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('business_settings')
        .select('*')
        .eq('id', 1)
        .single(),
    ]);

    const rawItems = itemsRes.data || [];
    const items: InvoiceOrderItem[] = rawItems.map((item) => ({
      id: item.id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    }));

    const business: BusinessSettings = (businessRes.data as BusinessSettings) || {
      id: 1,
      business_name: 'Amuthavalli Crackers',
      business_logo_url: null,
      business_address: 'Sivakasi - Kazhumalai Road, Sathirappatti, Vembakottai',
      business_mobile: '9943745026',
      reach_us_number: '9994874805',
      whatsapp_number: '9655965026',
      gpay_upi_numbers: ['9943745026', '8072736369'],
      gpay_qr_code_url: null,
      min_order_value: 3000,
    };

    return {
      orderId: orderRow.id,
      orderNumber: orderRow.order_number,
      invoiceToken: orderRow.invoice_token,
      createdAt: orderRow.created_at,
      status: orderRow.status,
      totalQuantity: orderRow.total_quantity,
      totalAmount: Number(orderRow.total_amount),
      notes: orderRow.notes,
      customer: {
        name: orderRow.customer_name,
        phone: orderRow.customer_phone,
        address: orderRow.customer_address,
        city: orderRow.customer_city,
        pincode: orderRow.customer_pincode,
      },
      items,
      business,
    };
  } catch (error) {
    console.error('[getInvoiceByToken] Exception retrieving invoice:', error);
    return null;
  }
}
