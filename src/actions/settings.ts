'use server';

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { createClient } from '@/lib/supabase/server';
import type { BusinessSettings } from '@/types/database';
import { revalidatePath } from 'next/cache';

export interface SettingsActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Fetch authoritative singleton business_settings record (id = 1)
 */
export async function getAdminBusinessSettings(): Promise<SettingsActionResult<BusinessSettings>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('[getAdminBusinessSettings] Supabase query error:', error);
      return {
        success: false,
        message: 'Failed to load business settings from database.',
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        message: 'Business settings record not found in database.',
      };
    }

    return {
      success: true,
      message: 'Business settings retrieved successfully.',
      data: data as BusinessSettings,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[getAdminBusinessSettings] Unexpected error:', err);
    return {
      success: false,
      message: 'Unexpected server error while loading business settings.',
      error: errorMsg,
    };
  }
}

/**
 * Update Shop Information (Name, Address, Mobile, Logo)
 */
export async function updateShopInformation(payload: {
  business_name: string;
  business_address: string;
  business_mobile: string;
  business_logo_url?: string | null;
}): Promise<SettingsActionResult> {
  try {
    if (!payload.business_name?.trim()) {
      return { success: false, message: 'Business Name is required.' };
    }
    if (!payload.business_address?.trim()) {
      return { success: false, message: 'Business Address is required.' };
    }
    if (!payload.business_mobile?.trim()) {
      return { success: false, message: 'Business Mobile is required.' };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('business_settings')
      .update({
        business_name: payload.business_name.trim(),
        business_address: payload.business_address.trim(),
        business_mobile: payload.business_mobile.trim(),
        ...(payload.business_logo_url !== undefined
          ? { business_logo_url: payload.business_logo_url }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      console.error('[updateShopInformation] Update error:', error);
      return { success: false, message: 'Failed to update Shop Information.', error: error.message };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/home');
    revalidatePath('/about');
    revalidatePath('/contact');

    return { success: true, message: 'Shop Information updated successfully.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return { success: false, message: 'Unexpected error saving Shop Information.', error: errorMsg };
  }
}

/**
 * Update Business Rules (Minimum Order Value)
 */
export async function updateBusinessRules(payload: {
  min_order_value: number;
}): Promise<SettingsActionResult> {
  try {
    if (typeof payload.min_order_value !== 'number' || isNaN(payload.min_order_value) || payload.min_order_value < 0) {
      return { success: false, message: 'Minimum Order Value must be a valid non-negative number.' };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('business_settings')
      .update({
        min_order_value: payload.min_order_value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      console.error('[updateBusinessRules] Update error:', error);
      return { success: false, message: 'Failed to update Business Rules.', error: error.message };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/checkout');

    return { success: true, message: 'Business Rules updated successfully.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return { success: false, message: 'Unexpected error saving Business Rules.', error: errorMsg };
  }
}

/**
 * Update Contact Information (Business Mobile, Reach Us, WhatsApp)
 */
export async function updateContactInformation(payload: {
  business_mobile: string;
  reach_us_number: string;
  whatsapp_number: string;
}): Promise<SettingsActionResult> {
  try {
    if (!payload.business_mobile?.trim()) {
      return { success: false, message: 'Contact Mobile Number is required.' };
    }
    if (!payload.reach_us_number?.trim()) {
      return { success: false, message: 'Reach Us Number is required.' };
    }
    if (!payload.whatsapp_number?.trim()) {
      return { success: false, message: 'WhatsApp Number is required.' };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('business_settings')
      .update({
        business_mobile: payload.business_mobile.trim(),
        reach_us_number: payload.reach_us_number.trim(),
        whatsapp_number: payload.whatsapp_number.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      console.error('[updateContactInformation] Update error:', error);
      return { success: false, message: 'Failed to update Contact Information.', error: error.message };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/home');
    revalidatePath('/about');
    revalidatePath('/contact');

    return { success: true, message: 'Contact Information updated successfully.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return { success: false, message: 'Unexpected error saving Contact Information.', error: errorMsg };
  }
}

/**
 * Update Payment Information (GPay / UPI Numbers, QR Code)
 */
export async function updatePaymentInformation(payload: {
  gpay_upi_numbers: string[];
  gpay_qr_code_url?: string | null;
}): Promise<SettingsActionResult> {
  try {
    const validNumbers = payload.gpay_upi_numbers.filter((n) => n.trim().length > 0);
    if (validNumbers.length === 0) {
      return { success: false, message: 'At least one GPay / UPI number is required.' };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('business_settings')
      .update({
        gpay_upi_numbers: validNumbers,
        ...(payload.gpay_qr_code_url !== undefined
          ? { gpay_qr_code_url: payload.gpay_qr_code_url }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      console.error('[updatePaymentInformation] Update error:', error);
      return { success: false, message: 'Failed to update Payment Information.', error: error.message };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/checkout');
    revalidatePath('/order-success');

    return { success: true, message: 'Payment Information updated successfully.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return { success: false, message: 'Unexpected error saving Payment Information.', error: errorMsg };
  }
}

/**
 * Upload Business Asset (Logo or GPay QR) to Supabase Storage 'business' bucket
 */
export async function uploadBusinessAsset(formData: FormData): Promise<SettingsActionResult<string>> {
  try {
    const file = formData.get('file') as File | null;
    const assetType = (formData.get('assetType') as string) || 'logo';

    if (!file) {
      return { success: false, message: 'No file provided for upload.' };
    }

    // Storage architecture verification: 800 KB file limit (819200 bytes)
    const MAX_FILE_SIZE = 819200;
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: 'File size exceeds maximum allowed limit of 800 KB per storage architecture.',
      };
    }

    const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        message: 'Invalid file format. Allowed formats: PNG, JPG, WEBP.',
      };
    }

    const supabase = createServiceRoleClient();
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${assetType}_${Date.now()}.${ext}`;
    const filePath = `${assetType === 'logo' ? 'logos' : 'qrcodes'}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('business')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[uploadBusinessAsset] Storage upload error:', uploadError);
      return { success: false, message: 'Failed to upload asset to storage.', error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('business').getPublicUrl(filePath);

    return {
      success: true,
      message: 'Asset uploaded successfully.',
      data: publicUrl,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[uploadBusinessAsset] Unexpected error:', err);
    return { success: false, message: 'Failed to process asset upload.', error: errorMsg };
  }
}

/**
 * Admin Password Update via Supabase Auth
 */
export async function updateAdminPassword(payload: {
  newPassword: string;
}): Promise<SettingsActionResult> {
  try {
    if (!payload.newPassword || payload.newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: 'Admin session not detected. Please log in with admin credentials to update password.',
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: payload.newPassword,
    });

    if (updateError) {
      console.error('[updateAdminPassword] Auth update error:', updateError);
      return { success: false, message: updateError.message, error: updateError.message };
    }

    return { success: true, message: 'Admin password updated successfully via Supabase Auth.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return { success: false, message: 'Unexpected error updating password.', error: errorMsg };
  }
}
