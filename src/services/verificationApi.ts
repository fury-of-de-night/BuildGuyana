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
  verificationId?: string;
}

export async function uploadDocumentForVerification({
  file,
  userId,
  documentType,
  documentUrl,
  verificationId,
}: UploadOptions): Promise<{ success: boolean; message: string; record?: VerificationRecord }> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('user_id', userId);
  formData.append('document_type', documentType);

  if (documentUrl) {
    formData.append('document_url', documentUrl);
  }

  if (verificationId) formData.append('verification_id', verificationId);

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { success: false, message: 'Please sign in before submitting documents for verification.' };
    }
    const res = await fetch(`${VERIFICATION_API_URL}/api/verify-with-crosscheck`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
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
      return { success: false, message: parsed?.error || parsed?.message || parsed?.detail || `API error: ${res.status}` };
    }

    if (!parsed.success || !parsed.record?.id) {
      return { success: false, message: 'The verification service did not return a saved submission.' };
    }
    // The API owns persistence; never create a second browser-side result record.
    return {
      success: true,
      message: 'Document submitted for verification.',
      record: parsed.record as VerificationRecord,
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