import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface VerificationDetailRecord {
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
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface VerificationDetailModalProps {
  record: VerificationDetailRecord;
  onClose: () => void;
  onUpdate: () => void;
}

function normalizeStatus(status: string): string {
  return (status || '').toLowerCase().trim();
}

// ADD THIS NEW FUNCTION HERE:
function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
export default function VerificationDetailModal({ record, onClose, onUpdate }: VerificationDetailModalProps) {
  const [notes, setNotes] = useState(record.admin_notes || '');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAction = async (status: 'approved' | 'rejected') => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('verifications')
        .update({
          status,
          admin_notes: notes || null,
        })
        .eq('id', record.id);

      if (error) throw error;

      setFeedback({ type: 'success', message: `Verification ${status}.` });
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 800);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update.' });
    }
    setActionLoading(false);
  };

  const extractedData = record.extracted_data || {};
  const crossCheck = record.cross_check_results || {};
  const allKeys = [...new Set([...Object.keys(extractedData), ...Object.keys(crossCheck)])].filter(
    (k) => typeof extractedData[k] !== 'object' && typeof crossCheck[k] !== 'object',
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getConfidenceColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const currentStatus = normalizeStatus(record.status);
  const isEditable = currentStatus === 'pending_review' || currentStatus === 'manual_review' || currentStatus === 'pending' || currentStatus === 'processing';
  const isFinalized = currentStatus === 'approved' || currentStatus === 'auto_approved' || currentStatus === 'rejected';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white border border-background-200/70 rounded-lg w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto mx-auto shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-background-200/70 sticky top-0 bg-white z-10 rounded-t-lg">
          <div>
            <h2 className="font-heading text-base md:text-lg text-foreground-900">
              Verification Detail
            </h2>
            <p className="text-xs text-foreground-500 mt-0.5">
              {record.profiles?.full_name || 'Unknown'} &middot; {record.document_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-foreground-600 text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 md:px-6 py-5 space-y-5">
          {/* Feedback */}
          {feedback && (
            <div className={`p-3 rounded-md border ${
              feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
            }`}>
              <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
                {feedback.message}
              </p>
            </div>
          )}

          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-background-50 border border-background-200/70 rounded-md p-3">
              <p className="text-[10px] text-foreground-500 font-label uppercase tracking-wider mb-0.5">Status</p>
              <p className="text-sm font-semibold text-foreground-900 font-label capitalize">{record.status}</p>
            </div>
            <div className="bg-background-50 border border-background-200/70 rounded-md p-3">
              <p className="text-[10px] text-foreground-500 font-label uppercase tracking-wider mb-0.5">Confidence</p>
              <p className={`text-sm font-semibold font-label ${getConfidenceColor(record.confidence || 0)}`}>
                {record.confidence || 0}%
              </p>
            </div>
            <div className="bg-background-50 border border-background-200/70 rounded-md p-3">
              <p className="text-[10px] text-foreground-500 font-label uppercase tracking-wider mb-0.5">User</p>
              <p className="text-sm font-semibold text-foreground-900 font-label truncate">
                {record.profiles?.full_name || 'Unknown'}
              </p>
            </div>
            <div className="bg-background-50 border border-background-200/70 rounded-md p-3">
              <p className="text-[10px] text-foreground-500 font-label uppercase tracking-wider mb-0.5">Date</p>
              <p className="text-sm font-semibold text-foreground-900 font-label">{formatDate(record.created_at)}</p>
            </div>
          </div>

{/* Document image — validated URL */}
{isValidHttpUrl(record.document_url) ? (
  <div className="bg-background-50 border border-background-200/70 rounded-lg p-4">
    <h3 className="font-label text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-3">
      Uploaded Document
    </h3>
    <img
      src={record.document_url}
      alt="Uploaded Document"
      className="w-full rounded-lg border border-background-200/70"
    />
    <p className="text-xs text-foreground-400 mt-2">
      Original file: {record.original_filename || record.filename}
    </p>
  </div>
) : isValidHttpUrl(record.log_url) ? (
  <div className="bg-background-50 border border-background-200/70 rounded-lg p-4">
    <h3 className="font-label text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-3">
      Document Link
    </h3>
    <a
      href={record.log_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
    >
      <div className="w-4 h-4 flex items-center justify-center">
        <i className="ri-external-link-line" />
      </div>
      View Document
    </a>
    <p className="text-xs text-foreground-400 mt-2">
      Original file: {record.original_filename || record.filename}
    </p>
  </div>
) : null}
          {/* Cross-check table */}
          {allKeys.length > 0 && (
            <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-background-200/70">
                <h3 className="font-label text-xs font-semibold text-foreground-700 uppercase tracking-wider">
                  Cross-Check Results
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="bg-background-100/50">
                      <th className="text-left px-4 py-2.5 text-foreground-600 font-label font-medium text-xs whitespace-nowrap">Field</th>
                      <th className="text-left px-4 py-2.5 text-foreground-600 font-label font-medium text-xs whitespace-nowrap">Extracted</th>
                      <th className="text-left px-4 py-2.5 text-foreground-600 font-label font-medium text-xs whitespace-nowrap">Expected</th>
                      <th className="text-center px-4 py-2.5 text-foreground-600 font-label font-medium text-xs whitespace-nowrap">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allKeys.map((key) => {
                      const extracted = extractedData[key];
                      const expected = crossCheck[key];
                      const isMatch = extracted === expected || (extracted != null && expected != null && String(extracted).toLowerCase() === String(expected).toLowerCase());
                      return (
                        <tr key={key} className="border-t border-background-200/70">
                          <td className="px-4 py-2.5 text-xs font-label text-foreground-700 capitalize whitespace-nowrap">
                            {key.replace(/_/g, ' ')}
                          </td>
                          <td className={`px-4 py-2.5 text-xs whitespace-nowrap ${!isMatch && extracted != null ? 'text-red-600 font-semibold' : 'text-foreground-800'}`}>
                            {extracted != null ? String(extracted) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-foreground-600 whitespace-nowrap">
                            {expected != null ? String(expected) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {isMatch ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">
                                <i className="ri-check-line text-xs" />
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-label whitespace-nowrap">
                                <i className="ri-close-line text-xs" />
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warnings */}
          {record.warnings && record.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-4">
              <h3 className="font-label text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-error-warning-line text-sm" />
                </div>
                Warnings
              </h3>
              <ul className="space-y-1">
                {record.warnings.map((w, idx) => (
                  <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Errors */}
          {record.errors && record.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200/60 rounded-lg p-4">
              <h3 className="font-label text-xs font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-close-circle-line text-sm" />
                </div>
                Errors
              </h3>
              <ul className="space-y-1">
                {record.errors.map((e, idx) => (
                  <li key={idx} className="text-xs text-red-800 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label htmlFor="admin-notes-modal" className="block font-label text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-2">
              Admin Notes
            </label>
            <textarea
              id="admin-notes-modal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add notes about this verification..."
              className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
            />
            <p className="text-xs text-foreground-400 mt-1 text-right">{notes.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 md:px-6 py-4 border-t border-background-200/70 sticky bottom-0 bg-white rounded-b-lg">
          <p className="text-xs text-foreground-500 order-2 sm:order-1 text-center sm:text-left">
            {isFinalized
              ? `This verification has already been ${currentStatus.replace('auto_', '')}.`
              : 'Choose an action below.'}
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2 justify-center sm:justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-label font-medium text-foreground-600 border border-background-200/70 rounded-md hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              Close
            </button>
            {isEditable && (
              <>
                <button
                  onClick={() => handleAction('rejected')}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-label font-medium bg-accent-500 hover:bg-accent-600 text-background-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {actionLoading ? '...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleAction('approved')}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-label font-medium bg-green-600 hover:bg-green-700 text-background-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {actionLoading ? '...' : 'Approve'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}