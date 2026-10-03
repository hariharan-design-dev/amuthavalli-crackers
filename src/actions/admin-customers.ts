'use server';

/**
 * Server Actions: Admin Customers Real Data Integration
 * Phase: Stage 2A — Implementation
 * Source of Truth: Supabase customers, orders tables
 *
 * Enforces:
 * - Server-authoritative data access (zero browser service-role key exposure)
 * - Server-side pagination, search, and time-based filtering
 * - Aggregated customer order statistics (excluding Cancelled from monetary total)
 * - Unique mobile validation with descriptive error reporting
 * - Real historical metrics and current calendar month definition for New Customers
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type {
  AdminCustomerRow,
  CustomerOrderHistoryItem,
  CustomerAdminMetrics,
  CustomerActionResult,
  OrderStatus,
} from '@/types/customer';

// Deterministic palette for initials avatar presentation
const AVATAR_COLORS = [
  'bg-rose-100 text-rose-600',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-red-100 text-red-600',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

export async function getAvatarColor(name: string): Promise<string> {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export interface GetCustomersParams {
  searchQuery?: string;
  timeFilter?: string; // "All Time" | "This Month" | "Last 30 Days" | "Last 90 Days"
  page?: number;
  pageSize?: number;
}

export interface GetCustomersResult {
  customers: AdminCustomerRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetch paginated customer records with search, time filtering, and aggregated order metrics.
 */
export async function getAdminCustomers(
  params: GetCustomersParams = {}
): Promise<GetCustomersResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, params.pageSize || 10);
  const searchQuery = params.searchQuery?.trim() || '';
  const timeFilter = params.timeFilter || 'All Time';

  const supabase = createServiceRoleClient();

  let query = supabase.from('customers').select('*', { count: 'exact' });

  // 1. Time Filter on customers.created_at
  const now = new Date();
  if (timeFilter === 'This Month') {
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    query = query.gte('created_at', startOfCurrentMonth);
  } else if (timeFilter === 'Last 30 Days') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', thirtyDaysAgo);
  } else if (timeFilter === 'Last 90 Days') {
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', ninetyDaysAgo);
  }

  // 2. Search query (name, mobile, address, city)
  if (searchQuery) {
    const term = `%${searchQuery}%`;
    query = query.or(`name.ilike.${term},mobile.ilike.${term},address.ilike.${term},city.ilike.${term}`);
  }

  // 3. Server-side range pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: customerRows, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[getAdminCustomers] Database error:', error);
    throw new Error('Failed to load customers from database.');
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (!customerRows || customerRows.length === 0) {
    return {
      customers: [],
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  }

  // 4. Batch query orders for these customers to calculate aggregates
  const customerIds = customerRows.map((c) => c.id);
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, customer_id, total_amount, status, created_at')
    .in('customer_id', customerIds);

  if (ordersError) {
    console.error('[getAdminCustomers] Orders fetch error:', ordersError);
  }

  const allOrders = orders || [];

  // 5. Map customers with joined aggregates
  const customers: AdminCustomerRow[] = await Promise.all(
    customerRows.map(async (c) => {
      const custOrders = allOrders.filter((o) => o.customer_id === c.id);
      const totalOrders = custOrders.length;
      const nonCancelledOrders = custOrders.filter((o) => o.status !== 'Cancelled');
      const totalSpent = nonCancelledOrders.reduce(
        (sum, o) => sum + Number(o.total_amount || 0),
        0
      );

      // Latest order
      const sortedOrders = [...custOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latestOrder = sortedOrders[0];
      const lastOrderDate = latestOrder ? formatDate(latestOrder.created_at) : null;

      // Full address composed from real columns
      const fullAddressParts = [c.address, c.city, c.pincode].filter(Boolean);
      const fullAddress = fullAddressParts.join(', ');

      const avatarColor = await getAvatarColor(c.name);

      return {
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        address: c.address,
        city: c.city,
        pincode: c.pincode,
        fullAddress,
        created_at: c.created_at,
        totalOrders,
        totalSpent,
        lastOrderDate,
        avatarColor,
      };
    })
  );

  return {
    customers,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Fetch authoritative order history for a selected customer.
 */
export async function getCustomerOrderHistory(
  customerId: string
): Promise<CustomerOrderHistoryItem[]> {
  if (!customerId) return [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, created_at, total_amount, status')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getCustomerOrderHistory] Error:', error);
    throw new Error('Failed to load customer order history.');
  }

  return (data || []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    date: formatDate(o.created_at),
    amount: Number(o.total_amount || 0),
    status: o.status as OrderStatus,
  }));
}

/**
 * Fetch real administrative customer summary statistics.
 */
export async function getAdminCustomerMetrics(): Promise<CustomerAdminMetrics> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  // 1. Total Customers & New Customers (current calendar month)
  const { count: totalCustomersCount, error: custErr } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  const { count: currentMonthCustCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfCurrentMonth);

  const { count: prevMonthCustCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfPrevMonth)
    .lt('created_at', startOfCurrentMonth);

  if (custErr) {
    console.error('[getAdminCustomerMetrics] Customer count error:', custErr);
  }

  // 2. Total Orders
  const { count: totalOrdersCount, error: ordersErr } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  const { count: currentMonthOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfCurrentMonth);

  const { count: prevMonthOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfPrevMonth)
    .lt('created_at', startOfCurrentMonth);

  if (ordersErr) {
    console.error('[getAdminCustomerMetrics] Orders count error:', ordersErr);
  }

  // 3. Total Order Value (excluding Cancelled)
  const { data: allOrders, error: orderValueErr } = await supabase
    .from('orders')
    .select('total_amount, status, created_at');

  if (orderValueErr) {
    console.error('[getAdminCustomerMetrics] Order value error:', orderValueErr);
  }

  const validOrders = (allOrders || []).filter((o) => o.status !== 'Cancelled');
  const totalValue = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const currMonthValue = validOrders
    .filter((o) => new Date(o.created_at) >= new Date(startOfCurrentMonth))
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const prevMonthValue = validOrders
    .filter(
      (o) =>
        new Date(o.created_at) >= new Date(startOfPrevMonth) &&
        new Date(o.created_at) < new Date(startOfCurrentMonth)
    )
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // Helper for trend formatting
  function computeTrend(curr: number, prev: number, defaultText = 'vs last month'): { trend: string; trendText: string } {
    if (prev > 0) {
      const diff = Math.round(((curr - prev) / prev) * 100);
      const sign = diff >= 0 ? '+' : '';
      return { trend: `${sign}${diff}%`, trendText: defaultText };
    }
    if (curr > 0) {
      return { trend: `+${curr}`, trendText: 'this month' };
    }
    return { trend: '0%', trendText: defaultText };
  }

  const custTrend = computeTrend(currentMonthCustCount ?? 0, prevMonthCustCount ?? 0);
  const ordersTrend = computeTrend(currentMonthOrdersCount ?? 0, prevMonthOrdersCount ?? 0);
  const valueTrend = computeTrend(currMonthValue, prevMonthValue);
  const newCustTrend = computeTrend(currentMonthCustCount ?? 0, prevMonthCustCount ?? 0, 'this month');

  return {
    totalCustomers: {
      value: (totalCustomersCount ?? 0).toLocaleString('en-IN'),
      trend: custTrend.trend,
      trendText: custTrend.trendText,
    },
    totalOrders: {
      value: (totalOrdersCount ?? 0).toLocaleString('en-IN'),
      trend: ordersTrend.trend,
      trendText: ordersTrend.trendText,
    },
    totalOrderValue: {
      value: `₹ ${Math.round(totalValue).toLocaleString('en-IN')}`,
      trend: valueTrend.trend,
      trendText: valueTrend.trendText,
    },
    newCustomers: {
      value: (currentMonthCustCount ?? 0).toLocaleString('en-IN'),
      trend: newCustTrend.trend,
      trendText: newCustTrend.trendText,
    },
  };
}

export interface CustomerInputData {
  name: string;
  mobile: string;
  address: string;
  city?: string | null;
  pincode?: string | null;
}

/**
 * Validate customer input payload.
 */
function validateCustomerInput(data: CustomerInputData): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length < 2) {
    return { valid: false, error: 'Customer name must be at least 2 characters.' };
  }
  const cleanedMobile = data.mobile.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }
  if (!data.address || data.address.trim().length < 3) {
    return { valid: false, error: 'Please enter a valid street address (minimum 3 characters).' };
  }
  if (data.pincode && data.pincode.trim()) {
    const cleanedPincode = data.pincode.replace(/\D/g, '');
    if (cleanedPincode.length !== 6) {
      return { valid: false, error: 'Pincode must be exactly 6 digits if provided.' };
    }
  }
  return { valid: true };
}

/**
 * Create a new standalone customer record directly from Admin.
 * Enforces mobile uniqueness.
 */
export async function createAdminCustomer(
  input: CustomerInputData
): Promise<CustomerActionResult<AdminCustomerRow>> {
  const validation = validateCustomerInput(input);
  if (!validation.valid) {
    return { success: false, code: 'VALIDATION_ERROR', message: validation.error };
  }

  const cleanedMobile = input.mobile.replace(/\D/g, '').slice(-10);
  const supabase = createServiceRoleClient();

  // Check for duplicate mobile
  const { data: existing, error: checkError } = await supabase
    .from('customers')
    .select('id, name')
    .eq('mobile', cleanedMobile)
    .maybeSingle();

  if (checkError) {
    console.error('[createAdminCustomer] Duplicate check error:', checkError);
  }

  if (existing) {
    return {
      success: false,
      code: 'DUPLICATE_MOBILE',
      message: `A customer with mobile number ${cleanedMobile} already exists (${existing.name}).`,
    };
  }

  const cleanedPincode = input.pincode?.replace(/\D/g, '') || null;

  const { data: created, error: insertError } = await supabase
    .from('customers')
    .insert({
      name: input.name.trim(),
      mobile: cleanedMobile,
      address: input.address.trim(),
      city: input.city?.trim() || null,
      pincode: cleanedPincode,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return {
        success: false,
        code: 'DUPLICATE_MOBILE',
        message: `A customer with mobile number ${cleanedMobile} already exists.`,
      };
    }
    console.error('[createAdminCustomer] Insert error:', insertError);
    return {
      success: false,
      code: 'INSERT_ERROR',
      message: 'Failed to create customer record in database.',
    };
  }

  const avatarColor = await getAvatarColor(created.name);
  const fullAddress = [created.address, created.city, created.pincode].filter(Boolean).join(', ');

  const newCustomerRow: AdminCustomerRow = {
    id: created.id,
    name: created.name,
    mobile: created.mobile,
    address: created.address,
    city: created.city,
    pincode: created.pincode,
    fullAddress,
    created_at: created.created_at,
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: null,
    avatarColor,
  };

  return {
    success: true,
    message: 'Customer record created successfully.',
    data: newCustomerRow,
  };
}

/**
 * Update an existing customer record.
 * Validates uniqueness of mobile across other customer records.
 */
export async function updateAdminCustomer(
  customerId: string,
  input: CustomerInputData
): Promise<CustomerActionResult<AdminCustomerRow>> {
  if (!customerId) {
    return { success: false, code: 'INVALID_ID', message: 'Customer ID is required.' };
  }

  const validation = validateCustomerInput(input);
  if (!validation.valid) {
    return { success: false, code: 'VALIDATION_ERROR', message: validation.error };
  }

  const cleanedMobile = input.mobile.replace(/\D/g, '').slice(-10);
  const supabase = createServiceRoleClient();

  // Check if mobile is used by another customer
  const { data: existing, error: checkError } = await supabase
    .from('customers')
    .select('id, name')
    .eq('mobile', cleanedMobile)
    .neq('id', customerId)
    .maybeSingle();

  if (checkError) {
    console.error('[updateAdminCustomer] Duplicate check error:', checkError);
  }

  if (existing) {
    return {
      success: false,
      code: 'DUPLICATE_MOBILE',
      message: `Mobile number ${cleanedMobile} is already in use by another customer (${existing.name}).`,
    };
  }

  const cleanedPincode = input.pincode?.replace(/\D/g, '') || null;

  const { data: updated, error: updateError } = await supabase
    .from('customers')
    .update({
      name: input.name.trim(),
      mobile: cleanedMobile,
      address: input.address.trim(),
      city: input.city?.trim() || null,
      pincode: cleanedPincode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single();

  if (updateError) {
    if (updateError.code === '23505') {
      return {
        success: false,
        code: 'DUPLICATE_MOBILE',
        message: `Mobile number ${cleanedMobile} is already in use by another customer.`,
      };
    }
    console.error('[updateAdminCustomer] Update error:', updateError);
    return {
      success: false,
      code: 'UPDATE_ERROR',
      message: 'Failed to update customer record in database.',
    };
  }

  // Get current order metrics for updated customer
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, status, created_at')
    .eq('customer_id', customerId);

  const custOrders = orders || [];
  const nonCancelled = custOrders.filter((o) => o.status !== 'Cancelled');
  const totalSpent = nonCancelled.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const sorted = [...custOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastOrderDate = sorted[0] ? formatDate(sorted[0].created_at) : null;
  const avatarColor = await getAvatarColor(updated.name);
  const fullAddress = [updated.address, updated.city, updated.pincode].filter(Boolean).join(', ');

  const updatedCustomerRow: AdminCustomerRow = {
    id: updated.id,
    name: updated.name,
    mobile: updated.mobile,
    address: updated.address,
    city: updated.city,
    pincode: updated.pincode,
    fullAddress,
    created_at: updated.created_at,
    totalOrders: custOrders.length,
    totalSpent,
    lastOrderDate,
    avatarColor,
  };

  return {
    success: true,
    message: 'Customer record updated successfully.',
    data: updatedCustomerRow,
  };
}
