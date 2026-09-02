import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import type { DemoQuote } from '@/contexts/DemoModeContext';
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

interface JobDetails {
  id: string;
  title: string;
  category: string;
  description: string | null;
  region: string;
  budget_min: number | null;
  budget_max: number | null;
  homeowner_id: string;
  status: string;
}

function getLeadCostCredits(budgetMin: number | null, budgetMax: number | null): number {
  const maxBudget = budgetMax || budgetMin || 0;
  if (maxBudget >= 2000000) return 5;
  if (maxBudget >= 300000) return 3;
  return 1;
}

export default function SubmitQuotePage() {
  return (
    <AuthGuard requiredRole="tradesperson">
      <SubmitQuoteForm />
    </AuthGuard>
  );
}

function SubmitQuoteForm() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, profile, contractorProfile } = useAuth();
  const { isDemo, demoJobs, demoLeads, demoUnlockedJobIds, submitDemoQuote } = useDemo();
  const { getCreditToGyd } = usePlatformSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notApproved, setNotApproved] = useState(false);

  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [estimatedTimeline, setEstimatedTimeline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      // === DEMO MODE ===
      if (isDemo) {
        const demoJob = demoJobs.find((j) => j.id === jobId);
        if (!demoJob) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        // Check if approved
        const hasApproved = demoLeads.some(
          (l) => l.job_id === jobId && l.status === 'approved'
        );
        if (!hasApproved) {
          setNotApproved(true);
          setLoading(false);
          return;
        }
        setJob({
          id: demoJob.id,
          title: demoJob.title,
          category: demoJob.category,
          description: demoJob.description,
          region: demoJob.region,
          budget_min: demoJob.budget_min,
          budget_max: demoJob.budget_max,
          homeowner_id: demoJob.homeowner_id,
          status: demoJob.status,
        });
        // Auto-fill form
        setProposedPrice('45000');
        setEstimatedTimeline('Within 1 week');
        setLoading(false);
        return;
      }

      // === LIVE MODE ===
      const result = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'open')
        .maybeSingle();

      if (result.error || !result.data) {
        setNotFound(true);
        return;
      }

      const jobData = result.data as JobDetails;

      if (contractorProfile) {
        const appResult = await supabase
          .from('job_applications')
          .select('id, status')
          .eq('job_id', jobId)
          .eq('contractor_id', contractorProfile.id)
          .maybeSingle();

        if (!appResult.data || appResult.data.status !== 'approved') {
          setNotApproved(true);
          return;
        }
      }

      setJob(jobData);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [jobId, contractorProfile, isDemo, demoJobs, demoLeads]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File must be under 10MB.');
        return;
      }
      setQuoteFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!job) return;

    const price = parseInt(proposedPrice.replace(/\D/g, ''), 10);
    if (!price || price <= 0) {
      setError('Please enter a valid proposed price.');
      return;
    }

    if (!estimatedTimeline.trim()) {
      setError('Please enter an estimated timeline.');
      return;
    }

    // === DEMO MODE ===
    if (isDemo) {
      const demoQuote: DemoQuote = {
        id: `demo-quote-${Date.now()}`,
        job_id: job.id,
        contractor_id: 'demo-contractor-001',
        contractor_name: 'Rajesh Singh',
        proposed_price: price,
        estimated_timeline: estimatedTimeline.trim(),
        status: 'submitted',
        created_at: new Date().toISOString(),
      };
      submitDemoQuote(demoQuote);
      setSuccess('Demo quote submitted! 1 credit deducted from your wallet.');
      setTimeout(() => navigate('/dashboard/tradesperson'), 1500);
      return;
    }

    // === LIVE MODE ===
    if (!contractorProfile || !user) return;

    setSubmitting(true);

    try {
      const cost = getLeadCostCredits(job.budget_min, job.budget_max);
      const walletResult = await supabase
        .from('contractor_wallet')
        .select('id, balance_credits')
        .eq('contractor_id', contractorProfile.id)
        .maybeSingle();

      if (!walletResult.data) {
        setError('Wallet not found. Please contact support.');
        setSubmitting(false);
        return;
      }

      const walletId = walletResult.data.id;
      const walletBalance = walletResult.data.balance_credits;

      if (walletBalance < cost) {
        setError(`Insufficient balance. You need ${cost} Credit${cost !== 1 ? 's' : ''} but only have ${walletBalance} Credits. Please top up your wallet.`);
        setSubmitting(false);
        return;
      }

      const existingQuote = await supabase
        .from('quotes')
        .select('id')
        .eq('job_id', job.id)
        .eq('contractor_id', contractorProfile.id)
        .maybeSingle();

      if (existingQuote.data) {
        setError('You have already submitted a quote for this job.');
        setSubmitting(false);
        return;
      }

      let quoteDocumentUrl: string | null = null;
      if (quoteFile) {
        try {
          const uploadResult = await uploadToCloudinary(quoteFile);
          quoteDocumentUrl = uploadResult.secure_url;
        } catch {
          setError('Failed to upload quote document. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      // 1. Save the quote FIRST — only proceed to deduct credits if this succeeds.
      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          job_id: job.id,
          contractor_id: contractorProfile.id,
          proposed_price: price,
          estimated_timeline: estimatedTimeline.trim(),
          quote_document_url: quoteDocumentUrl,
          status: 'submitted',
        })
        .select('id')
        .single();

      if (quoteError) throw quoteError;
      const quoteId = newQuote.id;

      // 2. Deduct credits from the wallet balance.
      const newBalance = walletBalance - cost;
      const { error: walletError } = await supabase
        .from('contractor_wallet')
        .update({ balance_credits: newBalance })
        .eq('id', walletId);

      if (walletError) throw walletError;

      // 3. Record the transaction using the NEW schema (negative amounts).
      //    If this fails, the quote is already saved — warn and keep it, do NOT delete.
      try {
        const { error: txError } = await supabase
          .from('wallet_transactions')
          .insert({
            contractor_id: contractorProfile.id,
            amount_credits: -cost,
            amount_gyd: -getCreditToGyd(cost),
            transaction_type: 'quote_submission',
            related_quote_id: quoteId,
            status: 'approved',
          });

        if (txError) throw txError;
      } catch (txErr) {
        console.error('Credit deduction failed:', txErr);
        setWarning('Quote saved, but credit deduction failed. Please contact support.');
        setSubmitting(false);
        return;
      }

      await supabase
        .from('job_applications')
        .update({ status: 'quote_submitted' })
        .eq('job_id', job.id)
        .eq('contractor_id', contractorProfile.id);

      await supabase
        .from('leads')
        .insert({
          job_id: job.id,
          contractor_id: contractorProfile.id,
          cost_gyd: getCreditToGyd(cost),
          homeowner_phone: '',
          unlocked_at: new Date().toISOString(),
        });

      const contractorName = profile?.full_name || 'A tradesperson';
      await supabase
        .from('notifications')
        .insert({
          user_id: job.homeowner_id,
          title: 'New Quote Received',
          message: `${contractorName} submitted a quote for your job "${job.title}". View it in your dashboard.`,
          is_read: false,
          sender_name: 'BuildGuyana System',
        });

      setSuccess('Your quote has been submitted! The project owner will review it and get back to you.');
      setTimeout(() => {
        navigate('/dashboard/tradesperson');
      }, 3000);
    } catch (err) {
      console.error('Quote submission error:', err);
      setError('Failed to submit quote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) return `GYD ${min.toLocaleString()} — ${max.toLocaleString()}`;
    if (min) return `From GYD ${min.toLocaleString()}`;
    if (max) return `Up to GYD ${max.toLocaleString()}`;
    return 'Not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (notApproved) {
    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
              <i className="ri-lock-line text-3xl text-foreground-400" />
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">Approval Required</h2>
            <p className="text-sm text-foreground-600 mb-4 max-w-md mx-auto">
              You need to be approved by the project owner before you can submit a quote. First, request to quote from the Available Jobs tab — it's free!
            </p>
            <button
              onClick={() => navigate('/dashboard/tradesperson')}
              className="px-4 py-2 bg-primary-500 text-background-50 text-sm font-label font-medium rounded-md hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
              <i className="ri-file-search-line text-3xl text-foreground-400" />
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">Job Not Available</h2>
            <p className="text-sm text-foreground-600 mb-4">This job may have been closed or removed.</p>
            <button
              onClick={() => navigate('/dashboard/tradesperson')}
              className="px-4 py-2 bg-primary-500 text-background-50 text-sm font-label font-medium rounded-md hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const leadCost = getLeadCostCredits(job.budget_min, job.budget_max);

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className={`flex-1 px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-8`}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-label text-foreground-600 hover:text-foreground-900 transition-colors cursor-pointer mb-6"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-left-line" />
            </div>
            Back
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">
              Request Approved
            </span>
            {isDemo && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                DEMO
              </span>
            )}
          </div>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">Submit Your Quote</h1>
          <p className="text-sm text-foreground-600 mb-8">
            Your request has been approved! Now submit your detailed quote. Credits will be deducted at this stage.
          </p>

          <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">
                {job.category}
              </span>
              <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">
                {job.region}
              </span>
              {isDemo && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                  DEMO
                </span>
              )}
            </div>
            <h2 className="font-heading text-lg font-semibold text-foreground-900 mb-2">{job.title}</h2>
            {job.description && (
              <p className="text-sm text-foreground-600 mb-3">{job.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-foreground-500">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 flex items-center justify-center">
                  <i className="ri-map-pin-line" />
                </div>
                {job.region} (Region only)
              </span>
              <span className="font-medium text-foreground-700">
                Budget: {formatBudget(job.budget_min, job.budget_max)}
              </span>
            </div>
            <p className="text-xs text-foreground-500 mt-3">
              Shortlisting this job will cost <strong className="text-foreground-800">{isDemo ? '1' : leadCost} Credit{leadCost !== 1 ? 's' : ''} (GYD ${(leadCost * 500).toLocaleString()})</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-accent-100/80 border border-accent-300/60 rounded-md">
              <p className="text-accent-900 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}
          {warning && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-800 text-sm">{warning}</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
              <div className="mb-5">
                <label htmlFor="proposedPrice" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Proposed Price (GYD) <span className="text-accent-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-foreground-500 bg-background-100 border border-background-200/70 border-r-0 rounded-l-md font-label">
                    GYD
                  </span>
                  <input
                    id="proposedPrice"
                    type="text"
                    inputMode="numeric"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-r-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                    placeholder="e.g. 250,000"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="timeline" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Estimated Timeline <span className="text-accent-500">*</span>
                </label>
                <select
                  id="timeline"
                  value={estimatedTimeline}
                  onChange={(e) => setEstimatedTimeline(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer"
                >
                  <option value="">Select timeline</option>
                  <option value="Within 1 week">Within 1 week</option>
                  <option value="Within 2 weeks">Within 2 weeks</option>
                  <option value="Within 1 month">Within 1 month</option>
                  <option value="Within 2 months">Within 2 months</option>
                  <option value="Within 3 months">Within 3 months</option>
                  <option value="3+ months">3+ months</option>
                </select>
              </div>

              {!isDemo && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                    Quote Document (Optional)
                  </label>
                  <p className="text-xs text-foreground-500 mb-2">
                    Upload your official quote document (PDF or image). You can include your company logo.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full text-sm text-foreground-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary-100 file:text-secondary-900 hover:file:bg-secondary-200 file:cursor-pointer cursor-pointer"
                  />
                  {quoteFile && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-12 h-12 rounded-md bg-background-100 border border-background-200/70 flex items-center justify-center overflow-hidden">
                        {quoteFile.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(quoteFile)} alt="Quote" className="w-full h-full object-cover" />
                        ) : (
                          <i className="ri-file-pdf-line text-2xl text-accent-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-foreground-700 font-label truncate max-w-[200px]">{quoteFile.name}</p>
                        <p className="text-xs text-foreground-400">{(quoteFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuoteFile(null)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-accent-100 text-accent-600 hover:bg-accent-200 transition-colors cursor-pointer"
                      >
                        <i className="ri-close-line text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isDemo && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200/60 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      <i className="ri-error-warning-line text-amber-600" />
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Do not include personal contact info in your quote.</strong> Contact details (phone, email, WhatsApp) will be shared only if the project owner hires you. Sharing contact info early violates our Terms of Service and may result in account suspension.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  `Submit Quote — ${isDemo ? '1' : leadCost} Credit${(isDemo ? 1 : leadCost) !== 1 ? 's' : ''} (GYD ${((isDemo ? 1 : leadCost) * 500).toLocaleString()})`
                )}
              </button>
              <p className="text-xs text-foreground-400 text-center mt-3">
                {isDemo ? '1 Credit will be deducted from your demo wallet.' : `${leadCost} Credit${leadCost !== 1 ? 's' : ''} (GYD ${(leadCost * 500).toLocaleString()}) will be deducted from your wallet. Contact info is only shared upon hire.`}
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}