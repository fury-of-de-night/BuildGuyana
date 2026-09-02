import { supabase } from '@/lib/supabase';

/**
 * Logs an admin's control panel access with their public IP address.
 * Fails silently — logging should never block the panel from opening.
 */
export async function logAdminAccess(adminId: string): Promise<void> {
  if (!adminId) return;

  let ipAddress = 'unknown';
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      ipAddress = data?.ip || 'unknown';
    }
  } catch {
    ipAddress = 'unknown';
  }

  try {
    const { error } = await supabase
      .from('admin_access_logs')
      .insert({
        admin_id: adminId,
        ip_address: ipAddress,
        accessed_at: new Date().toISOString(),
      });

    if (error) {
      console.warn('Failed to log admin access:', error.message);
    }
  } catch (err) {
    console.warn('Admin access logging failed:', err);
  }
}