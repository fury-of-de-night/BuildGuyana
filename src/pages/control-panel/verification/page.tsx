import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/feature/AuthGuard';

interface VerificationUser {
  profile_id: string;
  full_name: string;
  phone: string | null;
  category: string;
  other_trade_description: string | null;
  region: string;
  years_experience: number | null;
  verification_status: string;
  doc_business_reg: string | null;
  doc_gra: string | null;
  doc_nis: string | null;
  doc_profile: string | null;
  doc_id_card: string | null;
  doc_id_front: string | null;
  doc_id_back: string | null;
  doc_passport: string | null;
  id_verification_status: string;
  is_business: boolean;
  business_name: string | null;
  is_verified_business: boolean;
}

type DocKey = 'doc_business_reg' | 'doc_gra' | 'doc_nis' | 'doc_profile';

const DOC_LABELS: Record<DocKey, string> = {
  doc_business_reg: 'Business Registration',
  doc_gra: 'GRA Compliance',
  doc_nis: 'NIS Compliance',
  doc_profile: 'Company Profile',
};

const DOC_ICONS: Record<DocKey, string> = {
  doc_business_reg: 'ri-building-2-line',
  doc_gra: 'ri-file-text-line',
  doc_nis: 'ri-shield-line',
  doc_profile: 'ri-profile-line',
};

export default function VerificationPage() {
  return <AuthGuard requiredRole="admin"><VerificationDetail /></AuthGuard>;
}

function VerificationDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contractor, setContractor] = useState<VerificationUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Per-document action states
  const [docActions, setDocActions] = useState<Record<DocKey, 'pending' | 'approved' | 'declined'>>({
    doc_business_reg: 'pending',
    doc_gra: 'pending',
    doc_nis: 'pending',
    doc_profile: 'pending',
  });
  const [actionLoading, setActionLoading] = useState<DocKey | null>(null);

  // Note & WhatsApp
  const [noteText, setNoteText] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  const fetchContractor = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch contractor by profile_id (userId is the profile UUID)
      const { data: contractorData, error: cErr } = await supabase
        .from('contractors')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();

      if (cErr) throw cErr;
      if (!contractorData) {
        setContractor(null);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', userId)
        .maybeSingle();

      setContractor({
        profile_id: userId,
        full_name: profileData?.full_name || 'Unknown',
        phone: profileData?.phone || null,
        category: contractorData.category || '',
        other_trade_description: contractorData.other_trade_description || null,
        region: contractorData.region || '',
        years_experience: contractorData.years_experience || null,
        verification_status: contractorData.verification_status || 'pending',
        doc_business_reg: contractorData.doc_business_reg || null,
        doc_gra: contractorData.doc_gra || null,
        doc_nis: contractorData.doc_nis || null,
        doc_profile: contractorData.doc_profile || null,
        doc_id_card: contractorData.doc_id_card || null,
        doc_id_front: contractorData.doc_id_front || null,
        doc_id_back: contractorData.doc_id_back || null,
        doc_passport: contractorData.doc_passport || null,
        id_verification_status: contractorData.id_verification_status || 'pending',
        is_business: contractorData.is_business || false,
        business_name: contractorData.business_name || null,
        is_verified_business: contractorData.is_verified_business || false,
      });

      // Initialize doc action states based on what's uploaded
      const initialActions: Record<DocKey, 'pending' | 'approved' | 'declined'> = {
        doc_business_reg: 'pending',
        doc_gra: 'pending',
        doc_nis: 'pending',
        doc_profile: 'pending',
      };
      setDocActions(initialActions);
    } catch (err) {
      console.error('Failed to fetch contractor:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchContractor();
  }, [fetchContractor]);

  const handleDocAction = async (docKey: DocKey, action: 'approved' | 'declined') => {
    if (!contractor) return;
    setActionLoading(docKey);
    setFeedback(null);

    try {
      // Update local state immediately for UI feedback
      setDocActions((prev) => ({ ...prev, [docKey]: action }));

      // If declined, update verification_status to 'rejected' and send notification
      if (action === 'declined') {
        const { error: updateErr } = await supabase
          .from('contractors')
          .update({ verification_status: 'rejected' })
          .eq('profile_id', userId);

        if (updateErr) throw updateErr;

        // Send in-app notification
        const { error: notifErr } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Document Declined',
            message: `Your "${DOC_LABELS[docKey]}" document was declined. Please review and re-upload it from your profile.${noteText ? ` Note from admin: ${noteText}` : ''}`,
            is_read: false,
          });

        if (notifErr) console.error('Failed to send notification:', notifErr);

        setFeedback({ type: 'success', message: `"${DOC_LABELS[docKey]}" declined. Verification status set to 'rejected' and user notified.` });
      } else {
        // Individual doc approved — we keep verification_status as-is for partial approval
        setFeedback({ type: 'success', message: `"${DOC_LABELS[docKey]}" approved.` });
      }
    } catch (err: any) {
      console.error('Doc action failed:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to update document status.' });
      // Revert local state
      setDocActions((prev) => ({ ...prev, [docKey]: 'pending' }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    if (!contractor) return;
    setActionLoading('doc_business_reg');
    setFeedback(null);

    try {
      const badgeExpiryDate = new Date();
      badgeExpiryDate.setMonth(badgeExpiryDate.getMonth() + 6);

      const { error: updateErr } = await supabase
        .from('contractors')
        .update({
          verification_status: 'verified',
          verified: true,
        })
        .eq('profile_id', userId);

      if (updateErr) throw updateErr;

      // Award verified badge
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle();

      if (contractorData) {
        await supabase
          .from('badges')
          .insert({
            contractor_id: contractorData.id,
            badge_type: 'verified',
            awarded_at: new Date().toISOString(),
            badge_expiry_date: badgeExpiryDate.toISOString(),
            review_count_last_6_months: 0,
          });
      }

      // Mark all docs as approved
      setDocActions({
        doc_business_reg: 'approved',
        doc_gra: 'approved',
        doc_nis: 'approved',
        doc_profile: 'approved',
      });

      setFeedback({ type: 'success', message: 'All documents approved. User is now verified!' });
    } catch (err: any) {
      console.error('Approve all failed:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to approve.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendWhatsApp = () => {
    if (!contractor?.phone) return;
    const cleanedPhone = contractor.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hello, please check your BuildGuyana.gy profile regarding your verification status. Note: ${noteText || '(no additional notes)'}`
    );
    window.open(`https://wa.me/${cleanedPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-50 px-4">
        <div className="w-14 h-14 mb-4 rounded-full bg-accent-100 flex items-center justify-center">
          <i className="ri-user-unfollow-line text-2xl text-accent-700" />
        </div>
        <h2 className="font-heading text-lg text-foreground-900 mb-2">User Not Found</h2>
        <p className="text-sm text-foreground-500 mb-4">This tradesperson could not be found in the database.</p>
        <Link
          to="/bg-ops-7742"
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
        >
          Back to Control Panel
        </Link>
      </div>
    );
  }

  const uploadedDocs = (Object.keys(DOC_LABELS) as DocKey[]).filter((k) => contractor[k]);

  return (
    <div className="min-h-screen bg-background-50">
      <header className="bg-white border-b border-background-200/70 px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/bg-ops-7742"
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background-100 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-foreground-600" />
            </Link>
            <div>
              <h1 className="font-heading text-lg text-foreground-900">Verification Review</h1>
              <p className="text-xs text-foreground-500">{contractor.full_name}</p>
            </div>
          </div>
          <Link
            to="/bg-ops-7742"
            className="px-3 py-1.5 text-xs font-label text-foreground-600 border border-background-200/70 rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Back to Panel
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {feedback && (
          <div className={`p-4 rounded-md border ${
            feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
          }`}>
            <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
              {feedback.message}
            </p>
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
          <h2 className="font-heading text-base text-foreground-900 mb-4">User Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground-500 font-label mb-0.5">Full Name</p>
              <p className="text-sm text-foreground-900 font-medium">{contractor.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 font-label mb-0.5">Phone</p>
              <p className="text-sm text-foreground-900">{contractor.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 font-label mb-0.5">Category</p>
              <p className="text-sm text-foreground-900">
                <span className="inline-block px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full text-xs font-label">
                  {contractor.category}
                </span>
                {contractor.other_trade_description && (
                  <span className="ml-2 text-xs text-foreground-500 italic">{contractor.other_trade_description}</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 font-label mb-0.5">Region</p>
              <p className="text-sm text-foreground-900">{contractor.region}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 font-label mb-0.5">Experience</p>
              <p className="text-sm text-foreground-900">{contractor.years_experience ? `${contractor.years_experience} years` : 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 font-label mb-0.5">Business</p>
              <p className="text-sm text-foreground-900">
                {contractor.is_business ? (
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-building-line text-xs" />
                    {contractor.business_name || 'Business Account'}
                  </span>
                ) : (
                  <span className="text-foreground-400">Individual Tradesperson</span>
                )}
              </p>
            </div>
            {contractor.is_business && (
              <div>
                <p className="text-xs text-foreground-500 font-label mb-0.5">Verified Business Badge</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-label ${
                    contractor.is_verified_business
                      ? 'bg-green-100 text-green-700'
                      : 'bg-background-100 text-foreground-500'
                  }`}>
                    {contractor.is_verified_business ? (
                      <>
                        <i className="ri-check-line text-xs" />
                        Verified Business
                      </>
                    ) : (
                      'Not Awarded'
                    )}
                  </span>
                  {!contractor.is_verified_business && (
                    <button
                      onClick={async () => {
                        try {
                          await supabase
                            .from('contractors')
                            .update({ is_verified_business: true })
                            .eq('profile_id', userId);
                          await supabase
                            .from('notifications')
                            .insert({
                              user_id: userId,
                              title: 'Verified Business Badge Awarded',
                              message: 'Congratulations! Your business has been awarded the Verified Business badge by the BuildGuyana.gy admin team.',
                              is_read: false,
                            });
                          setFeedback({ type: 'success', message: 'Verified Business badge awarded!' });
                          fetchContractor();
                        } catch {
                          setFeedback({ type: 'error', message: 'Failed to award badge.' });
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-label font-medium bg-green-50 hover:bg-green-100 text-green-700 border border-green-200/70 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Award Verified Business
                    </button>
                  )}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-foreground-500 font-label mb-0.5">Status</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-label ${
                contractor.verification_status === 'verified'
                  ? 'bg-green-100 text-green-700'
                  : contractor.verification_status === 'rejected'
                    ? 'bg-accent-100 text-accent-700'
                    : 'bg-amber-100 text-amber-700'
              }`}>
                {contractor.verification_status === 'verified' && <i className="ri-check-line text-xs" />}
                {contractor.verification_status === 'rejected' && <i className="ri-close-line text-xs" />}
                {contractor.verification_status === 'pending' && <i className="ri-time-line text-xs" />}
                {contractor.verification_status.charAt(0).toUpperCase() + contractor.verification_status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base text-foreground-900">Uploaded Documents</h2>
            <span className="text-xs text-foreground-500">{uploadedDocs.length} of 4 uploaded</span>
          </div>

          {uploadedDocs.length === 0 ? (
            <div className="text-center py-10 bg-background-50 border border-background-200/70 rounded-lg">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <i className="ri-file-upload-line text-2xl text-foreground-400" />
              </div>
              <p className="text-sm text-foreground-600">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(Object.keys(DOC_LABELS) as DocKey[]).map((docKey) => {
                const url = contractor[docKey];
                const action = docActions[docKey];
                const isLoading = actionLoading === docKey;

                return (
                  <div
                    key={docKey}
                    className={`p-4 rounded-lg border transition-colors ${
                      action === 'approved'
                        ? 'bg-green-50/50 border-green-200/70'
                        : action === 'declined'
                          ? 'bg-accent-50/50 border-accent-200/70'
                          : 'bg-background-50 border-background-200/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Doc info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                          action === 'approved'
                            ? 'bg-green-100 text-green-600'
                            : action === 'declined'
                              ? 'bg-accent-100 text-accent-600'
                              : 'bg-background-100 text-foreground-500'
                        }`}>
                          <i className={`${DOC_ICONS[docKey]} text-lg`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground-900 font-label">{DOC_LABELS[docKey]}</p>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:text-primary-700 underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <i className="ri-external-link-line text-xs" />
                              View Document
                            </a>
                          ) : (
                            <p className="text-xs text-foreground-400">Not uploaded</p>
                          )}
                          {action !== 'pending' && (
                            <span className={`inline-block mt-1 text-xs font-label ${
                              action === 'approved' ? 'text-green-600' : 'text-accent-600'
                            }`}>
                              {action === 'approved' ? '✓ Approved' : '✗ Declined'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {url && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleDocAction(docKey, 'approved')}
                            disabled={isLoading || action === 'approved'}
                            className={`px-3 py-1.5 text-xs font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                              action === 'approved'
                                ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                                : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200/70'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isLoading && actionLoading === docKey ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDocAction(docKey, 'declined')}
                            disabled={isLoading || action === 'declined'}
                            className={`px-3 py-1.5 text-xs font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                              action === 'declined'
                                ? 'bg-accent-100 text-accent-700 border border-accent-200 cursor-default'
                                : 'bg-accent-50 hover:bg-accent-100 text-accent-700 border border-accent-200/70'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isLoading && actionLoading === docKey ? '...' : 'Decline'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Approve All button */}
          {uploadedDocs.length > 0 && (
            <div className="mt-5 pt-4 border-t border-background-200/70">
              <button
                onClick={handleApproveAll}
                disabled={actionLoading !== null}
                className="w-full sm:w-auto px-5 py-2.5 bg-green-600 hover:bg-green-700 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                Approve All Documents & Verify User
              </button>
            </div>
          )}
        </div>

        {/* ID Verification Card */}
        <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base text-foreground-900">ID Verification</h2>
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-label ${
              contractor.id_verification_status === 'approved'
                ? 'bg-green-100 text-green-700'
                : contractor.id_verification_status === 'rejected'
                  ? 'bg-accent-100 text-accent-700'
                  : 'bg-amber-100 text-amber-700'
            }`}>
              {contractor.id_verification_status === 'approved' && <i className="ri-check-line text-xs" />}
              {contractor.id_verification_status === 'rejected' && <i className="ri-close-line text-xs" />}
              {(!contractor.id_verification_status || contractor.id_verification_status === 'pending') && <i className="ri-time-line text-xs" />}
              {(contractor.id_verification_status || 'pending').charAt(0).toUpperCase() + (contractor.id_verification_status || 'pending').slice(1)}
            </span>
          </div>

          {(!contractor.doc_id_card && !contractor.doc_id_front && !contractor.doc_id_back && !contractor.doc_passport) ? (
            <div className="text-center py-6 bg-background-50 border border-background-200/70 rounded-lg">
              <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                <i className="ri-id-card-line text-xl text-foreground-400" />
              </div>
              <p className="text-sm text-foreground-600">No ID documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'National ID Card (Front)', url: contractor.doc_id_front || contractor.doc_id_card, key: 'id-front' },
                { label: 'National ID Card (Back)', url: contractor.doc_id_back, key: 'id-back' },
                { label: 'Passport', url: contractor.doc_passport, key: 'passport' },
              ].map((doc) => {
                if (!doc.url) return null;
                return (
                  <div key={doc.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-background-50 border border-background-200/70 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-background-100 text-foreground-500">
                        <i className={`${doc.key === 'id-card' ? 'ri-id-card-line' : 'ri-passport-line'} text-lg`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground-900 font-label">{doc.label}</p>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <i className="ri-external-link-line text-xs" />
                          View Document
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            await supabase
                              .from('contractors')
                              .update({ id_verification_status: 'approved' })
                              .eq('profile_id', userId);

                            await supabase
                              .from('notifications')
                              .insert({
                                user_id: userId,
                                title: 'ID Verification Approved',
                                message: 'Your ID verification has been approved by the admin team.',
                                is_read: false,
                              });

                            setFeedback({ type: 'success', message: 'ID verification approved!' });
                            fetchContractor();
                          } catch {
                            setFeedback({ type: 'error', message: 'Failed to approve ID.' });
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-label font-medium bg-green-50 hover:bg-green-100 text-green-700 border border-green-200/70 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Approve ID
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await supabase
                              .from('contractors')
                              .update({ id_verification_status: 'rejected' })
                              .eq('profile_id', userId);

                            await supabase
                              .from('notifications')
                              .insert({
                                user_id: userId,
                                title: 'ID Verification Failed',
                                message: 'Your ID verification was not approved. Please update your documents from your profile page.',
                                is_read: false,
                              });

                            setFeedback({ type: 'success', message: 'ID verification rejected and user notified.' });
                            fetchContractor();
                          } catch {
                            setFeedback({ type: 'error', message: 'Failed to reject ID.' });
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-label font-medium bg-accent-50 hover:bg-accent-100 text-accent-700 border border-accent-200/70 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Reject ID
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes & WhatsApp Card */}
        <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
          <h2 className="font-heading text-base text-foreground-900 mb-4">Return Note to User</h2>
          <div>
            <label htmlFor="verification-note" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
              Message for the Tradesperson
            </label>
            <textarea
              id="verification-note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="E.g. 'Your GRA document is expired. Please upload a current one.' or 'All good, you're verified!'"
              className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
            />
            <p className="text-xs text-foreground-400 mt-1">{noteText.length}/500</p>
          </div>
          <button
            onClick={handleSendWhatsApp}
            disabled={!contractor.phone}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-whatsapp-line" />
            </div>
            Send WhatsApp Note
          </button>
          {!contractor.phone && (
            <p className="text-xs text-foreground-400 mt-2">No phone number on file — WhatsApp unavailable.</p>
          )}
        </div>
      </main>
    </div>
  );
}
