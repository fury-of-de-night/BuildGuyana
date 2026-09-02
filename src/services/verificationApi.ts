import { VERIFICATION_API_URL } from '@/config/constants';
import { supabase } from '@/lib/supabase';

export interface VerificationRecord {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  document_type: string;
  status: string;
  confidence: number;
  source: string;
  extracted_data: Record<string, any> | null;
  cross_check_results: Record<string, any> | null;
  errors: string[] | null;
  warnings: string[] | null;
  admin_notes: string | null;
  log_url: string | null;
  document_url: string | null;
  created_at: string;
  profile?: {
    full_name: string;
    phone: string | null;
  } | null;
}

interface UploadOptions {
  file: File;
  userId: string;
  documentType: string;
  documentUrl?: string;
}

export async function uploadDocumentForVerification({
  file,
  userId,
  documentType,
  documentUrl,
}: UploadOptions): Promise<{ success: boolean; message: string; record?: VerificationRecord }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);
  formData.append('document_type', documentType);

  if (documentUrl) {
    formData.append('document_url', documentUrl);
  }

  try {
    const res = await fetch(`${VERIFICATION_API_URL}/api/verify-with-crosscheck`, {
      method: 'POST',
      body: formData,
    });

    const responseText = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return { success: false, message: `Invalid response from verification API: ${responseText.slice(0, 200)}` };
    }

    if (!res.ok) {
      return { success: false, message: parsed?.message || parsed?.detail || `API error: ${res.status}` };
    }

    // Use the document_url from the backend response if provided, otherwise fall back to what we sent
    const backendDocUrl = parsed.document_url || documentUrl || null;

    // Insert verification record into Supabase
    const { data: inserted, error: insertErr } = await supabase
      .from('verifications')
      .insert({
        user_id: userId,
        filename: parsed.filename || file.name,
        original_filename: file.name,
        document_type: documentType,
        document_url: backendDocUrl,
        status: parsed.status || 'pending_review',
        confidence: parsed.confidence || 0,
        source: 'verification_api',
        extracted_data: parsed.extracted_data || null,
        cross_check_results: parsed.cross_check_results || null,
        errors: parsed.errors || null,
        warnings: parsed.warnings || null,
        log_url: parsed.log_url || null,
      })
      .select('*')
      .single();

    if (insertErr) {
      return { success: false, message: `Saved to DB but failed to record: ${insertErr.message}` };
    }

    return {
      success: true,
      message: 'Document uploaded and verified successfully.',
      record: inserted as VerificationRecord,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error. Please try again.' };
  }
}

export async function getAdminVerifications(
  status?: string,
): Promise<{ success: boolean; data: VerificationRecord[]; message?: string }> {
  try {
    let query = supabase
      .from('verifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch profile names for all user_ids
    const userIds = [...new Set(data.map((v: any) => v.user_id).filter(Boolean))];
    let profileMap: Map<string, { full_name: string; phone: string | null }> = new Map();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          profileMap.set(p.id, { full_name: p.full_name || 'Unknown', phone: p.phone || null });
        });
      }
    }

    const enriched: VerificationRecord[] = data.map((v: any) => ({
      ...v,
      profile: profileMap.get(v.user_id) || null,
    }));

    return { success: true, data: enriched };
  } catch (err: any) {
    return { success: false, data: [], message: err?.message || 'Failed to fetch verifications.' };
  }
}

export async function updateVerificationStatus(
  id: string,
  status: string,
  notes: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const { error } = await supabase
      .from('verifications')
      .update({
        status,
        admin_notes: notes || null,
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to update verification.' };
  }
}