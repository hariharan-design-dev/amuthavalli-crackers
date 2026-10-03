import { createClient } from '@/lib/supabase/server';
import type { BusinessSettings } from '@/types/database';

/**
 * Data Access Layer: Business Settings
 * Phase: Phase 8 — Frontend Foundation
 *
 * Centralizes public business settings singleton query.
 */

export async function getPublicBusinessSettings(): Promise<BusinessSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_settings')
    .select(
      'id, business_name, business_logo_url, business_address, business_mobile, reach_us_number, whatsapp_number, gpay_upi_numbers, gpay_qr_code_url, min_order_value, updated_at'
    )
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('[getPublicBusinessSettings] Error fetching business settings:', error);
    return null;
  }

  return (data as BusinessSettings) || null;
}
