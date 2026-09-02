import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';

const PREDEFINED_MATERIALS = ['Cement', 'Steel', 'Lumber', 'Paint', 'Fixtures'];

export function ProfileTab() {
  const { profile, contractorProfile, refreshProfile } = useAuth();
  const { isDemo } = useDemo();

  const [businessName, setBusinessName] = useState(contractorProfile?.business_name || '');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState(contractorProfile?.payment_method_details || '');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [payoutDetails, setPayoutDetails] = useState(contractorProfile?.payout_details || '');
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutFeedback, setPayoutFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [materialsSupplied, setMaterialsSupplied] = useState<string[]>(contractorProfile?.materials_supplied || []);
  const [materialInput, setMaterialInput] = useState('');
  const [materialsSaving, setMaterialsSaving] = useState(false);
  const [materialsFeedback, setMaterialsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!contractorProfile) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
          <i className="ri-user-settings-line text-3xl text-foreground-400" />
        </div>
        <p className="text-foreground-600 text-sm">No contractor profile found.</p>
      </div>
    );
  }

  const isBusiness = !!contractorProfile.is_business;
  const isVerifiedBusiness = !!contractorProfile.is_verified_business;
  const hasPendingBusinessVerification = isBusiness && !isVerifiedBusiness;
  const businessType = contractorProfile.business_type || '';
  const businessTypeLabel = businessType === 'registered_company'
    ? 'Registered Company'
    : businessType === 'sole_proprietor'
      ? 'Sole Proprietor'
      : 'Individual';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isDemo) {
      setFeedback({ type: 'error', message: 'Business upgrades are not available in Demo mode.' });
      return;
    }

    if (!businessName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your business name.' });
      return;
    }

    if (!file) {
      setFeedback({ type: 'error', message: 'Please upload your Business Registration document.' });
      return;
    }

    if (!profile?.id) {
      setFeedback({ type: 'error', message: 'User profile not found. Please try logging in again.' });
      return;
    }

    setSubmitting(true);
    setUploadProgress('Uploading document...');

    try {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const filePath = `business-docs/${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(filePath);
      const docUrl = publicUrlData?.publicUrl || '';

      setUploadProgress('Saving your request...');

      const { error: updateErr } = await supabase
        .from('contractors')
        .update({
          is_business: true,
          business_name: businessName.trim(),
          business_type: 'registered_company',
          doc_business_reg: docUrl || null,
          verification_status: 'pending',
          verified: false,
        })
        .eq('id', contractorProfile.id);

      if (updateErr) throw new Error(`Profile update failed: ${updateErr.message}`);

      const { error: insertErr } = await supabase
        .from('verifications')
        .insert({
          user_id: profile.id,
          filename: filePath,
          original_filename: file.name,
          document_type: 'Business Registration',
          document_url: docUrl || null,
          status: 'PENDING',
          confidence: 0,
          source: 'manual_upload',
        });

      if (insertErr) console.warn('Failed to create verification record:', insertErr.message);

      setFeedback({
        type: 'success',
        message: 'Business upgrade requested! Our admin team will review your documents shortly.',
      });

      await refreshProfile();
      setFile(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selected.type)) {
      setFeedback({ type: 'error', message: 'Please upload a JPG, PNG, WebP, or PDF file.' });
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File size must be under 10MB.' });
      return;
    }

    setFile(selected);
    setFeedback(null);
  };

  const handleSavePaymentMethod = async () => {
    if (isDemo) {
      setPaymentFeedback({ type: 'error', message: 'Payment method is not available in Demo mode.' });
      return;
    }
    setPaymentSaving(true);
    setPaymentFeedback(null);
    try {
      const { error: updateErr } = await supabase
        .from('contractors')
        .update({ payment_method_details: paymentMethod.trim() || null })
        .eq('id', contractorProfile.id);

      if (updateErr) throw new Error(updateErr.message);

      setPaymentFeedback({ type: 'success', message: 'Payment method saved successfully!' });
      await refreshProfile();
    } catch (err: any) {
      setPaymentFeedback({ type: 'error', message: err?.message || 'Failed to save payment method.' });
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleSavePayout = async () => {
    if (isDemo) {
      setPayoutFeedback({ type: 'error', message: 'Payout details are not available in Demo mode.' });
      return;
    }
    setPayoutSaving(true);
    setPayoutFeedback(null);
    try {
      const { error: updateErr } = await supabase
        .from('contractors')
        .update({ payout_details: payoutDetails.trim() || null })
        .eq('id', contractorProfile.id);

      if (updateErr) throw new Error(updateErr.message);

      setPayoutFeedback({ type: 'success', message: 'Payout number saved successfully!' });
      await refreshProfile();
    } catch (err: any) {
      setPayoutFeedback({ type: 'error', message: err?.message || 'Failed to save payout number.' });
    } finally {
      setPayoutSaving(false);
    }
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

  const handleSaveMaterials = async () => {
    if (isDemo) {
      setMaterialsFeedback({ type: 'error', message: 'Materials are not available in Demo mode.' });
      return;
    }
    setMaterialsSaving(true);
    setMaterialsFeedback(null);
    try {
      const { error: updateErr } = await supabase
        .from('contractors')
        .update({ materials_supplied: materialsSupplied.length > 0 ? materialsSupplied : null })
        .eq('id', contractorProfile.id);

      if (updateErr) throw new Error(updateErr.message);

      setMaterialsFeedback({ type: 'success', message: 'Materials saved successfully!' });
      await refreshProfile();
    } catch (err: any) {
      setMaterialsFeedback({ type: 'error', message: err?.message || 'Failed to save materials.' });
    } finally {
      setMaterialsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Status Section */}
      <div className="bg-white border border-background-200/70 rounded-lg p-6">
        <h3 className="font-heading text-lg text-foreground-900 mb-2">Business Profile Status</h3>

        {isVerifiedBusiness ? (
          <div className="p-5 bg-green-50 border border-green-200/60 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <i className="ri-verified-badge-fill text-green-600 text-xl" />
              </div>
              <div>
                <h4 className="font-heading text-base font-semibold text-green-800">Verified Business</h4>
                <p className="text-sm text-green-700">{contractorProfile.business_name}</p>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Your business profile is verified. You can now enjoy enhanced visibility and trust on BuildGuyana.gy.
            </p>
          </div>
        ) : hasPendingBusinessVerification ? (
          <div className="p-5 bg-amber-50 border border-amber-200/60 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <i className="ri-time-line text-amber-600 text-xl" />
              </div>
              <div>
                <h4 className="font-heading text-base font-semibold text-amber-800">Pending Review</h4>
                <p className="text-sm text-amber-700">{contractorProfile.business_name}</p>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Your business verification request is under review. Our admin team will get back to you shortly. This usually takes 1-2 business days.
            </p>
          </div>
        ) : (
          <div>
            <div className="p-5 bg-background-50 border border-background-200/70 rounded-lg mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-background-100 flex items-center justify-center">
                  <i className="ri-building-line text-foreground-500 text-xl" />
                </div>
                <div>
                  <h4 className="font-heading text-base font-semibold text-foreground-900">Individual Account</h4>
                  <p className="text-sm text-foreground-600">Your profile is currently listed as an individual tradesperson.</p>
                </div>
              </div>
              <p className="text-xs text-foreground-500 mt-2">
                Upgrading to a Business Profile adds a verified business badge to your listing, building more trust with project owners and improving your search ranking.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="business-name" className="block font-label text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                  Business Name
                </label>
                <input
                  id="business-name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your registered business name"
                  maxLength={200}
                  disabled={submitting}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                />
              </div>

              <div>
                <label className="block font-label text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                  Business Registration Document
                </label>
                <div className="border-2 border-dashed border-background-200/70 rounded-lg p-6 text-center hover:border-primary-400/60 transition-colors">
                  {file ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-primary-100 flex items-center justify-center">
                        <i className="ri-file-text-line text-primary-600 text-lg" />
                      </div>
                      <p className="text-sm font-medium text-foreground-800">{file.name}</p>
                      <p className="text-xs text-foreground-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        disabled={submitting}
                        className="text-xs text-accent-600 hover:text-accent-700 underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-background-100 flex items-center justify-center">
                        <i className="ri-upload-cloud-2-line text-foreground-400 text-xl" />
                      </div>
                      <p className="text-sm text-foreground-700">Drag and drop your file here, or click to browse</p>
                      <p className="text-xs text-foreground-500">JPG, PNG, WebP, or PDF — max 10MB</p>
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-background-50 border border-background-200/70 rounded-md text-xs font-label font-medium text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer">
                        <div className="w-3.5 h-3.5 flex items-center justify-center">
                          <i className="ri-folder-open-line" />
                        </div>
                        Choose File
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          onChange={handleFileChange}
                          disabled={submitting}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {feedback && (
                <div className={`p-3 rounded-md border ${
                  feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
                }`}>
                  <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
                    {feedback.message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !businessName.trim() || !file}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {submitting ? (uploadProgress || 'Submitting...') : 'Request Business Badge'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Account Info Card */}
      <div className="bg-white border border-background-200/70 rounded-lg p-6">
        <h3 className="font-heading text-lg text-foreground-900 mb-4">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-0.5">Name</p>
            <p className="text-sm text-foreground-900 font-medium">{profile?.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-0.5">Account Type</p>
            <p className="text-sm text-foreground-900 font-medium">{businessTypeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-0.5">Trade Category</p>
            <p className="text-sm text-foreground-900 font-medium">{contractorProfile.category || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-0.5">Region</p>
            <p className="text-sm text-foreground-900 font-medium">{contractorProfile.region || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-0.5">Verification Status</p>
            <p className="text-sm text-foreground-900 font-medium capitalize">
              {contractorProfile.verification_status || 'Not Verified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-0.5">Years of Experience</p>
            <p className="text-sm text-foreground-900 font-medium">
              {contractorProfile.years_experience ? `${contractorProfile.years_experience} years` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Preferred Payment Method */}
      <div className="bg-white border border-background-200/70 rounded-lg p-6">
        <h3 className="font-heading text-lg text-foreground-900 mb-2">Preferred Payment Method</h3>
        <p className="text-xs text-foreground-500 mb-4">
          This is shared with project owners when they approve and mark a milestone as paid.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="e.g. MMG: 623-XXXX or Republic Bank: XXXX"
            maxLength={200}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
          />
          {paymentFeedback && (
            <div className={`p-3 rounded-md border ${
              paymentFeedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
            }`}>
              <p className={`text-sm ${paymentFeedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
                {paymentFeedback.message}
              </p>
            </div>
          )}
          <button
            onClick={handleSavePaymentMethod}
            disabled={paymentSaving}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {paymentSaving ? 'Saving...' : 'Save Payment Method'}
          </button>
        </div>
      </div>

      {/* Payout / Withdrawal Number */}
      <div className="bg-white border border-background-200/70 rounded-lg p-6">
        <h3 className="font-heading text-lg text-foreground-900 mb-2 flex items-center gap-2">
          My Payout/Withdrawal Number
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-edit-line text-foreground-400" />
          </span>
        </h3>
        <p className="text-xs text-foreground-500 mb-4">
          The account where your payments should be sent. This may differ from your phone number.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={payoutDetails}
            onChange={(e) => setPayoutDetails(e.target.value)}
            placeholder="e.g. MMG: 623-XXXX or Republic Bank: XXXX"
            maxLength={200}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
          />
          {payoutFeedback && (
            <div className={`p-3 rounded-md border ${
              payoutFeedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
            }`}>
              <p className={`text-sm ${payoutFeedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
                {payoutFeedback.message}
              </p>
            </div>
          )}
          <button
            onClick={handleSavePayout}
            disabled={payoutSaving}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {payoutSaving ? 'Saving...' : 'Save Payout Number'}
          </button>
        </div>
      </div>

      {/* Materials Supplied */}
      <div className="bg-white border border-background-200/70 rounded-lg p-6">
        <h3 className="font-heading text-lg text-foreground-900 mb-2">Materials Supplied</h3>
        <p className="text-xs text-foreground-500 mb-4">
          Select the materials you supply, or add your own custom materials.
        </p>

        {materialsSupplied.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {materialsSupplied.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary-50 text-secondary-700 text-xs font-label rounded-full border border-secondary-200/70">
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

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={materialInput}
            onChange={(e) => setMaterialInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomMaterial(); } }}
            placeholder="Add a custom material..."
            className="flex-1 px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
          />
          <button
            type="button"
            onClick={addCustomMaterial}
            disabled={!materialInput.trim()}
            className="px-4 py-2.5 bg-secondary-500 hover:bg-secondary-600 text-background-50 text-sm font-label font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            Add
          </button>
        </div>

        {materialsFeedback && (
          <div className={`p-3 rounded-md border ${
            materialsFeedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
          }`}>
            <p className={`text-sm ${materialsFeedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
              {materialsFeedback.message}
            </p>
          </div>
        )}

        <button
          onClick={handleSaveMaterials}
          disabled={materialsSaving}
          className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {materialsSaving ? 'Saving...' : 'Save Materials'}
        </button>
      </div>
    </div>
  );
}