import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { REGIONS } from '@/mocks/locations';
import { CATEGORY_NAMES } from '@/mocks/categories';

const PREDEFINED_MATERIALS = ['Cement', 'Steel', 'Lumber', 'Paint', 'Fixtures'];

export default function MyProfilePage() {
  return (
    <AuthGuard>
      <MyProfile />
    </AuthGuard>
  );
}

function MyProfile() {
  const { user, profile, contractorProfile, activeRole, hasDualRoles, refreshProfile, setActiveRole, signOut, recoverAccount, needsProfileCompletion } = useAuth();
  const { isDemo } = useDemo();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [region, setRegion] = useState(profile?.region || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [bio, setBio] = useState(contractorProfile?.bio || '');
  const [facebookPageUrl, setFacebookPageUrl] = useState(contractorProfile?.facebook_page_url || '');
  const [paymentMethodDetails, setPaymentMethodDetails] = useState(contractorProfile?.payment_method_details || '');
  const [payoutDetails, setPayoutDetails] = useState(contractorProfile?.payout_details || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [portfolioImages, setPortfolioImages] = useState<string[]>(contractorProfile?.portfolio_images || []);
  const [profileSecondaryTrades, setProfileSecondaryTrades] = useState<string[]>(contractorProfile?.secondary_trades || []);
  const [secondaryDropdownOpen, setSecondaryDropdownOpen] = useState(false);
  const [materialsSupplied, setMaterialsSupplied] = useState<string[]>(contractorProfile?.materials_supplied || []);
  const [materialInput, setMaterialInput] = useState('');

  // Document re-upload state
  const [docBusinessReg, setDocBusinessReg] = useState<File | null>(null);
  const [docGra, setDocGra] = useState<File | null>(null);
  const [docNis, setDocNis] = useState<File | null>(null);
  const [docProfile, setDocProfile] = useState<File | null>(null);
  const [reuploadingDocs, setReuploadingDocs] = useState(false);
  const [removingDocField, setRemovingDocField] = useState<string | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Direct DB role check — bypasses AuthContext cache
  const [roleCheckLoading, setRoleCheckLoading] = useState(true);
  const [dbIsTradesperson, setDbIsTradesperson] = useState(false);
  const [dbIsProjectOwner, setDbIsProjectOwner] = useState(false);

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setRoleCheckLoading(false);
        return;
      }
      setRoleCheckLoading(true);
      try {
        // Query 1: Check contractors table — having a row means they're registered as tradesperson
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractors')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (contractorError) {
          console.error('Contractor lookup failed:', contractorError.message);
        }

        // Query 2: Check profiles table for both role flags in a single query
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_tradesperson, is_project_owner')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile lookup failed:', profileError.message);
        }

        // is_tradesperson = contractor row exists OR profiles flag is true
        setDbIsTradesperson(!!contractorData || !!profileData?.is_tradesperson);
        // is_project_owner = profiles flag is true
        setDbIsProjectOwner(!!profileData?.is_project_owner);
      } catch (err) {
        console.error('Failed to check roles from DB:', err);
      } finally {
        setRoleCheckLoading(false);
      }
    };
    checkRoles();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const result = await uploadToCloudinary(file);
      setAvatarUrl(result.secure_url);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to upload profile photo.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (portfolioImages.length + files.length > 10) {
      setFeedback({ type: 'error', message: 'Maximum 10 portfolio images allowed.' });
      return;
    }
    setUploadingPortfolio(true);
    try {
      for (const file of files) {
        const result = await uploadToCloudinary(file);
        setPortfolioImages((prev) => [...prev, result.secure_url]);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to upload portfolio image.' });
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleProfileSecondaryTrade = (tradeName: string) => {
    setProfileSecondaryTrades((prev) => {
      if (prev.includes(tradeName)) return prev.filter((t) => t !== tradeName);
      if (prev.length >= 3) return prev;
      return [...prev, tradeName];
    });
  };

  const toggleMaterial = (m: string) => {
    setMaterialsSupplied((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const addCustomMaterial = () => {
    const v = materialInput.trim();
    if (!v) return;
    if (!materialsSupplied.includes(v)) setMaterialsSupplied((prev) => [...prev, v]);
    setMaterialInput('');
  };

  const handleReportUser = async () => {
    if (!reportReason) {
      setReportFeedback({ type: 'error', message: 'Please select a reason.' });
      return;
    }
    setReportSubmitting(true);
    setReportFeedback(null);
    try {
      const { error: insertErr } = await supabase
        .from('reports')
        .insert({
          reporter_id: user!.id,
          reported_user_id: contractorProfile?.profile_id || '',
          reason: reportReason,
          details: reportDetails.trim() || null,
        });

      if (insertErr) throw insertErr;

      setReportFeedback({ type: 'success', message: 'Report submitted. Our team will review it.' });
      setTimeout(() => {
        setShowReportModal(false);
        setReportFeedback(null);
      }, 1500);
    } catch (err: any) {
      setReportFeedback({ type: 'error', message: err?.message || 'Failed to submit report.' });
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      // Update profiles table
      if (profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: phone.trim(),
            region: region || null,
            location: location.trim() || null,
            avatar_url: avatarUrl || null,
          })
          .eq('id', profile.id);

        if (profileError) throw profileError;
      }

      // Update contractors table if tradesperson
      if (contractorProfile) {
        const { error: contractorError } = await supabase
          .from('contractors')
          .update({
            bio: bio.trim() || null,
            region: region || null,
            facebook_page_url: facebookPageUrl.trim() || null,
            payment_method_details: paymentMethodDetails.trim() || null,
            payout_details: payoutDetails.trim() || null,
            portfolio_images: portfolioImages.length > 0 ? portfolioImages : null,
            secondary_trades: profileSecondaryTrades,
            materials_supplied: materialsSupplied.length > 0 ? materialsSupplied : null,
          })
          .eq('id', contractorProfile.id);

        if (contractorError) throw contractorError;
      }

      await refreshProfile();
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDocReupload = async () => {
    if (!contractorProfile || !user) return;
    setReuploadingDocs(true);
    setFeedback(null);

    try {
      // Fetch the correct contractor_id
      const { data: ctData, error: ctErr } = await supabase
        .from('contractors')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (ctErr || !ctData) {
        setFeedback({ type: 'error', message: 'Could not find your contractor profile.' });
        return;
      }

      const contractorId = ctData.id;
      const updates: Record<string, string> = {};

      const uploadDoc = async (label: string, file: File | null, field: string) => {
        if (!file) return;
        try {
          const result = await uploadToCloudinary(file);
          updates[field] = result.secure_url;
        } catch (uploadErr) {
          console.error(`[Profile] ${label} upload failed:`, uploadErr);
        }
      };

      await uploadDoc('Business Reg', docBusinessReg, 'doc_business_reg');
      await uploadDoc('GRA', docGra, 'doc_gra');
      await uploadDoc('NIS', docNis, 'doc_nis');
      await uploadDoc('Company Profile', docProfile, 'doc_profile');

      if (Object.keys(updates).length > 0) {
        // Reset verification status back to pending for re-review
        updates.verification_status = 'pending';

        const { error: updateErr } = await supabase
          .from('contractors')
          .update(updates)
          .eq('id', contractorId);

        if (updateErr) throw updateErr;
      }

      await refreshProfile();
      setDocBusinessReg(null);
      setDocGra(null);
      setDocNis(null);
      setDocProfile(null);
      setFeedback({ type: 'success', message: 'Documents submitted for re-verification!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to upload documents.' });
    } finally {
      setReuploadingDocs(false);
    }
  };

  const handleRemoveDoc = async (field: string) => {
    if (!contractorProfile || !user) return;
    setRemovingDocField(field);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('contractors')
        .update({ [field]: null, verification_status: null })
        .eq('id', contractorProfile.id);

      if (error) throw error;

      await refreshProfile();
      setFeedback({ type: 'success', message: 'Document removed. You can upload a new one.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to remove document.' });
    } finally {
      setRemovingDocField(null);
    }
  };

  const handleSoftDelete = async () => {
    if (!user) return;
    setDeleting(true);
    setDeleteFeedback(null);
    try {
      const now = new Date().toISOString();

      // 1. Anonymize profiles — wipe all PII + set recovery window timestamp
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: 'Deleted User',
          phone: null,
          avatar_url: null,
          location: null,
          region: 'N/A',
          deleted_at: now,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Anonymize contractors — wipe all business + document PII
      const { error: contractorError } = await supabase
        .from('contractors')
        .update({
          business_name: 'Deleted Business',
          bio: null,
          doc_id_front: null,
          doc_id_back: null,
          doc_passport: null,
          doc_id_card: null,
          doc_business_reg: null,
          doc_gra: null,
          doc_nis: null,
          doc_profile: null,
          trade_license_number: null,
          trade_license_doc_url: null,
          trade_license_status: null,
          facebook_page_url: null,
          portfolio_images: null,
          secondary_trades: null,
          verification_doc_url: null,
        })
        .eq('profile_id', user.id);

      if (contractorError) throw contractorError;

      // 3. TODO: future Supabase Edge Function to purge Cloudinary documents.
      // Review/job stats (rating, review_count, years_experience) are intentionally retained.

      setDeleteFeedback({ type: 'success', message: 'Your account has been deactivated. You can recover it within 30 days by signing in again.' });
      setTimeout(() => {
        setShowDeleteModal(false);
        setDeleteFeedback(null);
        signOut();
        navigate('/');
      }, 1500);
    } catch (err: unknown) {
      setDeleteFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete account. Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  const isTradesperson = dbIsTradesperson;
  const isProjectOwner = dbIsProjectOwner;
  const dualRoles = isTradesperson && isProjectOwner;

  // Deleted account — show recovery screen (30-day window)
  if (profile?.deleted_at) {
    const deletedMs = new Date(profile.deleted_at).getTime();
    const withinWindow = Date.now() - deletedMs <= 30 * 24 * 60 * 60 * 1000;
    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-28 pb-12">
          <div className="w-full max-w-md">
            <div className="bg-white border border-background-200/70 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-100 flex items-center justify-center">
                <i className="ri-user-unfollow-line text-2xl text-accent-600" />
              </div>
              <h1 className="font-heading text-xl text-foreground-900 mb-2">Account Deleted</h1>
              <p className="text-sm text-foreground-600 mb-6">
                This account has been deactivated and personal information removed.
              </p>
              {withinWindow ? (
                <>
                  <p className="text-xs text-foreground-500 mb-4">
                    You can still recover your account within 30 days of deletion.
                  </p>
                  <button
                    onClick={() => recoverAccount()}
                    className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Recover Account
                  </button>
                </>
              ) : (
                <p className="text-xs text-foreground-500">
                  The 30-day recovery window has expired. Please create a new account.
                </p>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className={`flex-1 px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-8`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
                My Profile
              </h1>
              <p className="text-foreground-600 text-sm mt-1">
                Update your personal information and portfolio
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-foreground-500 hover:text-foreground-700 flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-arrow-left-line" />
              Back
            </button>
          </div>

          {feedback && (
            <div className={`mb-6 p-4 rounded-md border ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-accent-100/80 border-accent-300/60'
            }`}>
              <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
                {feedback.message}
              </p>
            </div>
          )}

          {needsProfileCompletion && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm font-label font-semibold text-amber-800">Complete Your Profile</p>
              <p className="text-xs text-amber-700 mt-1">
                Some of your profile details are missing. Add your full name and region below to get the most out of BuildGuyana.gy.
              </p>
            </div>
          )}

          {/* Role Card */}
          <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
            <h2 className="font-heading text-base font-semibold text-foreground-900 mb-4">
              Your Roles
            </h2>

            {roleCheckLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Tradesperson Role */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  isTradesperson
                    ? activeRole === 'tradesperson'
                      ? 'bg-primary-50 border-primary-300/60'
                      : 'bg-background-50 border-background-200/70'
                    : 'bg-background-50 border-background-200/70'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isTradesperson ? 'bg-primary-100 text-primary-600' : 'bg-background-200 text-foreground-400'
                    }`}>
                      <i className="ri-tools-fill text-lg" />
                    </div>
                    <div>
                      <p className={`font-label text-sm font-semibold ${
                        isTradesperson ? 'text-foreground-900' : 'text-foreground-500'
                      }`}>
                        Tradesperson
                      </p>
                      <p className="text-xs text-foreground-500">
                        {isTradesperson
                          ? activeRole === 'tradesperson'
                            ? 'Currently active'
                            : 'Inactive view'
                          : 'Not registered'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {isTradesperson ? (
                      dualRoles && activeRole !== 'tradesperson' ? (
                        <button
                          onClick={() => { setActiveRole('tradesperson'); navigate('/dashboard/tradesperson'); }}
                          className="px-3 py-1.5 rounded-md font-label text-xs font-medium bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Switch to This
                        </button>
                      ) : activeRole === 'tradesperson' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-label font-medium">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-check-line" />
                          </div>
                          Active
                        </span>
                      ) : null
                    ) : (
                      <Link
                        to="/register"
                        className="px-3 py-1.5 rounded-md font-label text-xs font-medium border border-primary-300/60 text-primary-600 hover:bg-primary-50 transition-colors whitespace-nowrap"
                      >
                        Sign Up as Tradesperson
                      </Link>
                    )}
                  </div>
                </div>

                {/* Project Owner Role */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  isProjectOwner
                    ? activeRole === 'project_owner'
                      ? 'bg-secondary-50 border-secondary-300/60'
                      : 'bg-background-50 border-background-200/70'
                    : 'bg-background-50 border-background-200/70'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isProjectOwner ? 'bg-secondary-100 text-secondary-600' : 'bg-background-200 text-foreground-400'
                    }`}>
                      <i className="ri-home-gear-fill text-lg" />
                    </div>
                    <div>
                      <p className={`font-label text-sm font-semibold ${
                        isProjectOwner ? 'text-foreground-900' : 'text-foreground-500'
                      }`}>
                        Project Owner
                      </p>
                      <p className="text-xs text-foreground-500">
                        {isProjectOwner
                          ? activeRole === 'project_owner'
                            ? 'Currently active'
                            : 'Inactive view'
                          : 'Not registered'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {isProjectOwner ? (
                      dualRoles && activeRole !== 'project_owner' ? (
                        <button
                          onClick={() => { setActiveRole('project_owner'); navigate('/dashboard/project-owner'); }}
                          className="px-3 py-1.5 rounded-md font-label text-xs font-medium bg-secondary-500 text-background-50 hover:bg-secondary-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Switch to This
                        </button>
                      ) : activeRole === 'project_owner' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-label font-medium">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-check-line" />
                          </div>
                          Active
                        </span>
                      ) : null
                    ) : (
                      <Link
                        to="/register"
                        className="px-3 py-1.5 rounded-md font-label text-xs font-medium border border-secondary-300/60 text-secondary-600 hover:bg-secondary-50 transition-colors whitespace-nowrap"
                      >
                        Sign Up as Project Owner
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {dualRoles && (
              <p className="mt-3 text-xs text-foreground-500">
                You have both roles. The active role determines which dashboard and navigation links you see.
              </p>
            )}

            {!isTradesperson && !isProjectOwner && !roleCheckLoading && (
              <p className="mt-3 text-xs text-foreground-500">
                You don&apos;t have any role set up yet. Choose one to get started.
              </p>
            )}
          </div>

          {/* Reputation Points */}
          {(isTradesperson || isProjectOwner) && (
            <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
              <h2 className="font-heading text-base font-semibold text-foreground-900 mb-3">Reputation Points</h2>
              <div className="flex flex-wrap gap-3">
                {isTradesperson && (
                  <span className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200/60 rounded-md">
                    <span className="text-base">🏆</span>
                    <span className="text-sm font-label font-semibold text-primary-700 whitespace-nowrap">
                      {profile?.trustworthy_pro_points ?? 0} Trustworthy Pro Points
                    </span>
                  </span>
                )}
                {isProjectOwner && (
                  <span className="inline-flex items-center gap-2 px-3 py-2 bg-secondary-50 border border-secondary-200/60 rounded-md">
                    <span className="text-base">🤝</span>
                    <span className="text-sm font-label font-semibold text-secondary-700 whitespace-nowrap">
                      {profile?.reliable_payer_points ?? 0} Reliable Payer Points
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border border-background-200/70 rounded-lg p-6 md:p-8 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-background-200/70">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-background-100 border-2 border-background-200/70">
                  {(avatarUrl || profile?.avatar_url) ? (
                    <img src={avatarUrl || profile?.avatar_url || ''} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="ri-user-line text-3xl text-foreground-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <i className={`${uploadingAvatar ? 'ri-loader-4-line animate-spin' : 'ri-camera-line'} text-sm`} />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-foreground-500">
                {profile?.region || 'Guyana'}
              </p>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  WhatsApp Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-foreground-500 bg-background-100 border border-background-200/70 border-r-0 rounded-l-md">+592</span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-r-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Region
                </label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="">Select region</option>
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  City / Town
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Georgetown, New Amsterdam"
                />
              </div>
            </div>

            {/* Tradesperson-specific fields */}
            {contractorProfile && (
              <div className="pt-6 border-t border-background-200/70 space-y-4">
                <h3 className="font-heading text-base text-foreground-900">Business Information</h3>

                {/* Secondary Trades */}
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Secondary Trades ({profileSecondaryTrades.length}/3)
                  </label>
                  <p className="text-xs text-foreground-500 mb-2">
                    Additional skills to appear in more search results.
                  </p>
                  {profileSecondaryTrades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {profileSecondaryTrades.map((trade) => (
                        <span key={trade} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-label rounded-full border border-primary-200/70">
                          {trade}
                          <button
                            type="button"
                            onClick={() => toggleProfileSecondaryTrade(trade)}
                            className="w-3.5 h-3.5 flex items-center justify-center cursor-pointer"
                          >
                            <i className="ri-close-line text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSecondaryDropdownOpen(!secondaryDropdownOpen)}
                      className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 text-left focus:outline-none focus:border-primary-500 cursor-pointer flex items-center justify-between"
                    >
                      <span className={profileSecondaryTrades.length === 0 ? 'text-foreground-400' : 'text-foreground-900'}>
                        {profileSecondaryTrades.length === 0 ? 'Add secondary trades...' : `${profileSecondaryTrades.length} selected`}
                      </span>
                      <i className={`ri-arrow-down-s-line text-foreground-400 transition-transform ${secondaryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {secondaryDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-background-200/70 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {CATEGORY_NAMES.filter((n) => n !== contractorProfile?.category).map((tradeName) => {
                          const isSelected = profileSecondaryTrades.includes(tradeName);
                          const isDisabled = !isSelected && profileSecondaryTrades.length >= 3;
                          return (
                            <button
                              key={tradeName}
                              type="button"
                              onClick={() => toggleProfileSecondaryTrade(tradeName)}
                              disabled={isDisabled}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between cursor-pointer ${
                                isSelected ? 'bg-primary-50 text-primary-700' : isDisabled ? 'text-foreground-300 cursor-not-allowed' : 'text-foreground-700 hover:bg-background-50'
                              }`}
                            >
                              <span>{tradeName}</span>
                              {isSelected && <i className="ri-check-line text-primary-500 text-sm" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {secondaryDropdownOpen && (
                      <div className="fixed inset-0 z-0" onClick={() => setSecondaryDropdownOpen(false)} />
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Bio / Business Description
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 resize-vertical"
                    placeholder="Describe your business and services..."
                  />
                  <p className="text-xs text-foreground-400 mt-1">{bio.length}/500</p>
                </div>

                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Facebook Business Page URL
                  </label>
                  <input
                    id="facebook"
                    type="url"
                    value={facebookPageUrl}
                    onChange={(e) => setFacebookPageUrl(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500"
                    placeholder="https://facebook.com/yourbusiness"
                  />
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Preferred Payment Method
                  </label>
                  <input
                    id="paymentMethod"
                    type="text"
                    value={paymentMethodDetails}
                    onChange={(e) => setPaymentMethodDetails(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500"
                    placeholder="e.g. MMG: 623-XXXX or Republic Bank: XXXX"
                  />
                  <p className="text-xs text-foreground-400 mt-1">Shown to project owners when approving a milestone payment.</p>
                </div>

                <div>
                  <label htmlFor="payoutDetails" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label flex items-center gap-1.5">
                    My Payout/Withdrawal Number
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-edit-line text-foreground-400" />
                    </span>
                  </label>
                  <input
                    id="payoutDetails"
                    type="text"
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500"
                    placeholder="e.g. MMG: 623-XXXX or Republic Bank: XXXX"
                  />
                  <p className="text-xs text-foreground-400 mt-1">The account where your payments should be sent. This may differ from your phone number.</p>
                </div>

                {/* Materials Supplied */}
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Materials Supplied
                  </label>
                  <p className="text-xs text-foreground-500 mb-2">
                    Select materials you supply, or add your own custom materials.
                  </p>
                  {materialsSupplied.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {materialsSupplied.map((m) => (
                        <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-50 text-secondary-700 text-xs font-label rounded-full border border-secondary-200/70">
                          {m}
                          <button type="button" onClick={() => toggleMaterial(m)} className="w-3.5 h-3.5 flex items-center justify-center cursor-pointer">
                            <i className="ri-close-line text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PREDEFINED_MATERIALS.filter((m) => !materialsSupplied.includes(m)).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMaterial(m)}
                        className="px-2.5 py-1 bg-background-50 border border-background-200/70 text-foreground-600 text-xs font-label rounded-full hover:border-primary-300/60 hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        + {m}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={materialInput}
                      onChange={(e) => setMaterialInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomMaterial(); } }}
                      placeholder="Add a custom material..."
                      className="flex-1 px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomMaterial}
                      disabled={!materialInput.trim()}
                      className="px-4 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Portfolio Images */}
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Portfolio Images ({portfolioImages.length}/10)
                  </label>
                  <p className="text-xs text-foreground-500 mb-3">
                    Upload photos of your completed work. Maximum 10 images.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
                    {portfolioImages.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border border-background-200/70">
                        <img src={url} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePortfolioImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-accent-500 text-background-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <i className="ri-close-line text-xs" />
                        </button>
                      </div>
                    ))}
                    {portfolioImages.length < 10 && (
                      <button
                        onClick={() => portfolioInputRef.current?.click()}
                        disabled={uploadingPortfolio}
                        className="aspect-square rounded-md border-2 border-dashed border-background-300/60 flex flex-col items-center justify-center gap-1 hover:border-primary-400 transition-colors cursor-pointer"
                      >
                        <i className={`${uploadingPortfolio ? 'ri-loader-4-line animate-spin' : 'ri-add-line'} text-foreground-400 text-lg`} />
                        <span className="text-xs text-foreground-400">Add Photo</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={portfolioInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePortfolioUpload}
                    className="hidden"
                  />
                </div>

                {/* ID Verification Status */}
                {(contractorProfile.doc_id_card || contractorProfile.doc_passport || contractorProfile.id_verification_status) && (
                  <div className="pt-4 border-t border-background-200/70">
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                      ID Verification
                    </label>

                    {contractorProfile.id_verification_status === 'approved' ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-label">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-check-line text-xs" />
                          </div>
                          ID Verified
                        </span>
                      </div>
                    ) : contractorProfile.id_verification_status === 'rejected' ? (
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-accent-100 text-accent-700 rounded-full font-label">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-close-circle-line text-xs" />
                          </div>
                          ID Verification Failed
                        </span>
                        <p className="text-xs text-foreground-500">Your ID documents were not approved. Please update them.</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-time-line text-xs" />
                          </div>
                          ID Verification Pending
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {[
                        { label: 'National ID Card', url: contractorProfile.doc_id_card, icon: 'ri-id-card-line' },
                        { label: 'Passport', url: contractorProfile.doc_passport, icon: 'ri-passport-line' },
                      ].map((doc) => (
                        <div key={doc.label} className="flex items-center gap-2 p-2.5 bg-background-50 border border-background-200/70 rounded-md">
                          <div className="w-8 h-8 rounded flex items-center justify-center bg-background-100 flex-shrink-0">
                            <i className={`${doc.icon} text-sm text-foreground-500`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-foreground-600 font-label truncate">{doc.label}</p>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-600 hover:text-primary-700 underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <i className="ri-external-link-line text-xs" />
                                View
                              </a>
                            ) : (
                              <span className="text-xs text-foreground-400">Not uploaded</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Documents */}
                <div className="pt-4 border-t border-background-200/70">
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Verification Documents
                  </label>

                  {contractorProfile.verification_status === 'verified' ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-label">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-check-line text-xs" />
                          </div>
                          Verified — Documents Locked
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Business Registration', url: contractorProfile.doc_business_reg, icon: 'ri-building-2-line' },
                          { label: 'GRA Compliance', url: contractorProfile.doc_gra, icon: 'ri-file-text-line' },
                          { label: 'NIS Compliance', url: contractorProfile.doc_nis, icon: 'ri-shield-line' },
                          { label: 'Company Profile', url: contractorProfile.doc_profile, icon: 'ri-profile-line' },
                        ].map((doc) => (
                          <div key={doc.label} className="flex items-center gap-2 p-2.5 bg-background-50 border border-background-200/70 rounded-md">
                            <div className="w-8 h-8 rounded flex items-center justify-center bg-background-100 flex-shrink-0">
                              <i className={`${doc.icon} text-sm text-foreground-500`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-foreground-600 font-label truncate">{doc.label}</p>
                              {doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary-600 hover:text-primary-700 underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <i className="ri-external-link-line text-xs" />
                                  View
                                </a>
                              ) : (
                                <span className="text-xs text-foreground-400">Not uploaded</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : contractorProfile.verification_status === 'rejected' ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-accent-100 text-accent-700 rounded-full font-label">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-close-circle-line text-xs" />
                          </div>
                          Rejected — Please Re-upload
                        </span>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Business Registration', state: docBusinessReg, setState: setDocBusinessReg, key: 'bus-reg-re' },
                          { label: 'GRA Compliance', state: docGra, setState: setDocGra, key: 'gra-re' },
                          { label: 'NIS Compliance', state: docNis, setState: setDocNis, key: 'nis-re' },
                          { label: 'Company Profile', state: docProfile, setState: setDocProfile, key: 'profile-re' },
                        ].map((doc) => (
                          <div key={doc.key} className="flex items-center justify-between p-2.5 bg-background-50 border border-background-200/70 rounded-md">
                            <span className="text-xs text-foreground-700 font-label">{doc.label}</span>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) doc.setState(file);
                                }}
                                className="hidden"
                              />
                              <span className={`text-xs px-3 py-1 rounded-md font-label transition-colors ${
                                doc.state
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-white border border-background-200/70 text-foreground-500 hover:border-primary-300/60 hover:text-primary-600'
                              }`}>
                                {doc.state ? (
                                  <span className="flex items-center gap-1">
                                    <i className="ri-check-line text-xs" />
                                    {doc.state.name.length > 15 ? doc.state.name.slice(0, 15) + '...' : doc.state.name}
                                  </span>
                                ) : 'Upload'}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleDocReupload}
                        disabled={reuploadingDocs || (!docBusinessReg && !docGra && !docNis && !docProfile)}
                        className="mt-4 w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                      >
                        {reuploadingDocs ? 'Uploading...' : 'Update Documents'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label">
                          <div className="w-3 h-3 flex items-center justify-center">
                            <i className="ri-time-line text-xs" />
                          </div>
                          Pending Review
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Business Registration', url: contractorProfile.doc_business_reg, icon: 'ri-building-2-line', field: 'doc_business_reg' },
                          { label: 'GRA Compliance', url: contractorProfile.doc_gra, icon: 'ri-file-text-line', field: 'doc_gra' },
                          { label: 'NIS Compliance', url: contractorProfile.doc_nis, icon: 'ri-shield-line', field: 'doc_nis' },
                          { label: 'Company Profile', url: contractorProfile.doc_profile, icon: 'ri-profile-line', field: 'doc_profile' },
                        ].map((doc) => (
                          <div key={doc.label} className="flex items-center gap-2 p-2.5 bg-background-50 border border-background-200/70 rounded-md">
                            <div className="w-8 h-8 rounded flex items-center justify-center bg-background-100 flex-shrink-0">
                              <i className={`${doc.icon} text-sm text-foreground-500`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-foreground-600 font-label truncate">{doc.label}</p>
                              {doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary-600 hover:text-primary-700 underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <i className="ri-external-link-line text-xs" />
                                  View
                                </a>
                              ) : (
                                <span className="text-xs text-foreground-400">Not uploaded</span>
                              )}
                            </div>
                            {doc.url && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(doc.field)}
                                disabled={removingDocField === doc.field}
                                className="text-xs text-accent-600 hover:text-accent-700 font-label underline cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {removingDocField === doc.field ? 'Removing...' : 'Remove'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="pt-6 border-t border-background-200/70">
              <button
                onClick={handleSave}
                disabled={saving || !fullName.trim()}
                className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            {contractorProfile && (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      to={`/tradesperson/${contractorProfile.id}/reviews`}
                      className="text-sm text-primary-600 hover:text-primary-700 font-label flex items-center gap-1 cursor-pointer"
                    >
                      <i className="ri-star-line" />
                      Show My Public Reviews
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setShowReportModal(true); setReportReason(''); setReportDetails(''); setReportFeedback(null); }}
                      className="text-sm text-accent-600 hover:text-accent-700 font-label flex items-center gap-1 cursor-pointer"
                    >
                      <i className="ri-flag-line" />
                      Report User
                    </button>
                  </div>
                </>
              )}

            {/* Danger Zone */}
            <div className="pt-6 border-t border-background-200/70">
              <h2 className="font-heading text-base font-semibold text-accent-700 mb-1">Danger Zone</h2>
              <p className="text-sm text-foreground-600 mb-4">
                Permanently deactivate your account and remove your personal information from BuildGuyana.gy.
              </p>
              <button
                onClick={() => { setShowDeleteModal(true); setDeleteFeedback(null); }}
                className="px-4 py-2.5 border border-accent-300/60 text-accent-700 hover:bg-accent-50 rounded-md text-sm font-label font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-background-200/70 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="font-heading text-lg text-foreground-900 mb-1">Report User</h2>
            <p className="text-sm text-foreground-600 mb-4">
              Report {contractorProfile ? 'this tradesperson' : 'this user'} for inappropriate behavior.
            </p>

            {reportFeedback && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                reportFeedback.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-accent-100/80 border border-accent-300/60 text-accent-900'
              }`}>
                {reportFeedback.message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Reason <span className="text-accent-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="">Select a reason</option>
                  <option value="No-show">No-show</option>
                  <option value="Unprofessional">Unprofessional</option>
                  <option value="Spam">Spam</option>
                  <option value="Poor Quality">Poor Quality</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Details (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 resize-vertical"
                  placeholder="Describe what happened..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReportUser}
                disabled={reportSubmitting || !reportReason}
                className="flex-1 py-2.5 px-4 bg-accent-500 hover:bg-accent-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white border border-background-200/70 rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-3">
                <i className="ri-delete-bin-line text-xl text-accent-600" />
              </div>
              <h2 className="font-heading text-lg font-bold text-foreground-900 mb-1">Delete Account?</h2>
              <p className="text-sm text-foreground-600 leading-relaxed">
                This will deactivate your account and remove your name, phone number, and profile photo. You can recover your account within 30 days.
              </p>
            </div>

            {deleteFeedback && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                deleteFeedback.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-accent-100/80 border border-accent-300/60 text-accent-900'
              }`}>
                {deleteFeedback.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 text-sm font-label font-medium text-foreground-700 border border-background-200/70 rounded-md hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSoftDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 text-sm font-label font-medium bg-accent-500 hover:bg-accent-600 text-background-50 rounded-md transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}