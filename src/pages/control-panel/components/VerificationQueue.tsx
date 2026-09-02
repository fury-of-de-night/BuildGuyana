import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import VerificationDetailModal from './VerificationDetailModal';

interface VerificationRecord {
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

const STATUS_MAP: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  auto_approved: { border: 'border-green-300/60', bg: 'bg-green-50/60', dot: 'bg-green-500', label: 'Approved' },
  approved: { border: 'border-green-300/60', bg: 'bg-green-50/60', dot: 'bg-green-500', label: 'Approved' },
  manual_review: { border: 'border-amber-300/60', bg: 'bg-amber-50/60', dot: 'bg-amber-500', label: 'Manual Review' },
  pending_review: { border: 'border-amber-300/60', bg: 'bg-amber-50/60', dot: 'bg-amber-500', label: 'Manual Review' },
  pending: { border: 'border-amber-300/60', bg: 'bg-amber-50/60', dot: 'bg-amber-500', label: 'Pending' },
  rejected: { border: 'border-red-300/60', bg: 'bg-red-50/60', dot: 'bg-red-500', label: 'Rejected' },
  processing: { border: 'border-secondary-300/60', bg: 'bg-secondary-50/60', dot: 'bg-secondary-500', label: 'Processing' },
};

function normalizeStatus(status: string): string {
  return (status || '').toLowerCase().trim();
}

function getStatusInfo(status: string) {
  const key = normalizeStatus(status);
  return STATUS_MAP[key] || STATUS_MAP.pending;
}

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected';

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending / Manual Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function VerificationQueue() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('verifications')
        .select('*, profiles!verifications_user_id_fkey(id, full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      setRecords((data || []) as VerificationRecord[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load verifications.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredRecords(records);
      return;
    }

    setFilteredRecords(
      records.filter((r) => {
        const s = normalizeStatus(r.status);
        if (activeFilter === 'approved') return s === 'approved' || s === 'auto_approved';
        if (activeFilter === 'rejected') return s === 'rejected';
        if (activeFilter === 'pending') return s === 'pending' || s === 'pending_review' || s === 'manual_review' || s === 'processing';
        return false;
      }),
    );
  }, [records, activeFilter]);

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

  const getConfidenceBg = (pct: number) => {
    if (pct >= 80) return 'bg-green-100';
    if (pct >= 50) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const counts = {
    all: records.length,
    pending: records.filter((r) => {
      const s = normalizeStatus(r.status);
      return s === 'pending' || s === 'pending_review' || s === 'manual_review' || s === 'processing';
    }).length,
    approved: records.filter((r) => {
      const s = normalizeStatus(r.status);
      return s === 'approved' || s === 'auto_approved';
    }).length,
    rejected: records.filter((r) => normalizeStatus(r.status) === 'rejected').length,
  };

  return (
    <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
      <div className="p-4 md:p-5 border-b border-background-200/70">
        <h2 className="font-heading text-lg text-foreground-900">Verification Queue</h2>
        <p className="text-sm text-foreground-600 mt-1">
          All document verification submissions pulled directly from Supabase. Review and approve or reject each one.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap border-b border-background-200/70">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 py-3 px-4 text-sm font-label font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
              activeFilter === tab.key
                ? 'text-primary-600 border-primary-500'
                : 'text-foreground-600 border-transparent hover:text-foreground-800 hover:bg-background-50'
            }`}
          >
            {tab.label}
            <span className="text-xs text-foreground-400 ml-0.5">
              ({counts[tab.key]})
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="m-4 md:m-5 p-3 rounded-md border border-accent-300/60 bg-accent-100/80">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-error-warning-line text-accent-600" />
            </div>
            <p className="text-sm text-accent-900">{error}</p>
          </div>
          <button
            onClick={fetchRecords}
            className="mt-2 text-xs font-label font-medium text-accent-700 hover:text-accent-800 underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-shield-check-line text-3xl text-foreground-400" />
          </div>
          <p className="text-foreground-600 text-sm font-label">
            {activeFilter !== 'all'
              ? `No ${activeFilter} verifications found`
              : 'No verification records yet'}
          </p>
          <p className="text-foreground-500 text-xs mt-1">
            Documents uploaded by tradespeople will appear here for review.
          </p>
        </div>
      ) : (
        /* Responsive grid of cards */
        <div className="p-4 md:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredRecords.map((record) => {
              const s = getStatusInfo(record.status);
              const hasNameMatch = record.cross_check_results?.name_match === true;
              const confidencePct = record.confidence || 0;

              return (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`text-left border rounded-lg p-4 md:p-5 transition-colors cursor-pointer hover:shadow-sm ${s.border} ${s.bg}`}
                >
                  {/* Status dot + label */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    <span className="text-xs font-label font-semibold text-foreground-700 uppercase tracking-wider">
                      {s.label}
                    </span>
                  </div>

                  {/* User name */}
                  <h4 className="font-heading text-sm font-semibold text-foreground-900 mb-1 break-words">
                    {record.profiles?.full_name || 'Unknown User'}
                  </h4>

                  {/* Document type */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">
                      {record.document_type || 'Document'}
                    </span>
                  </div>

                  {/* Document preview thumbnail if available */}
                  {record.document_url && (
                    <div className="mb-3 rounded-md overflow-hidden border border-background-200/70 h-24 bg-background-50">
                      <img
                        src={record.document_url}
                        alt={record.original_filename || 'Document'}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Confidence */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-foreground-500 font-label whitespace-nowrap">Confidence:</span>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-label font-semibold ${getConfidenceBg(confidencePct)} ${getConfidenceColor(confidencePct)}`}>
                      {confidencePct}%
                    </div>
                  </div>

                  {/* Name match badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-foreground-500 font-label whitespace-nowrap">Name Match:</span>
                    {hasNameMatch ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label">
                        <i className="ri-check-line text-xs" />
                        Match
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-label">
                        <i className="ri-close-line text-xs" />
                        Mismatch
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <p className="text-[10px] text-foreground-400 mt-2">
                    {formatDate(record.created_at)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <VerificationDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdate={fetchRecords}
        />
      )}
    </div>
  );
}