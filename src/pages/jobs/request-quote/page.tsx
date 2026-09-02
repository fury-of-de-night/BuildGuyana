import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
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

export default function RequestQuotePage() {
  return (
    <AuthGuard requiredRole="tradesperson">
      <RequestQuoteForm />
    </AuthGuard>
  );
}

function RequestQuoteForm() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, profile, contractorProfile } = useAuth();
  const { isDemo, demoJobs, demoUnlockedJobIds, requestDemoQuote } = useDemo();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [interestMessage, setInterestMessage] = useState('');
  const [experienceMessage, setExperienceMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadyRequested, setAlreadyRequested] = useState(false);

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
        if (demoUnlockedJobIds.has(jobId)) {
          setAlreadyRequested(true);
        }
        // Auto-fill form
        setInterestMessage('I am highly interested in this job and available immediately.');
        setExperienceMessage('I have 5 years of professional plumbing experience in Region 4.');
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

      if (jobData.homeowner_id === user?.id) {
        setError('You cannot request a quote for your own job.');
        setNotFound(true);
        return;
      }

      setJob(jobData);

      if (contractorProfile) {
        const existing = await supabase
          .from('job_applications')
          .select('id, status')
          .eq('job_id', jobId)
          .eq('contractor_id', contractorProfile.id)
          .maybeSingle();

        if (existing.data) {
          setAlreadyRequested(true);
        }
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [jobId, user?.id, contractorProfile, isDemo, demoJobs, demoUnlockedJobIds]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!job) return;

    const interestWords = interestMessage.trim().split(/\s+/).filter(Boolean).length;
    const expWords = experienceMessage.trim().split(/\s+/).filter(Boolean).length;
    if (interestWords > 200) {
      setError(`Interest message: ${interestWords} words. Maximum is 200 words.`);
      return;
    }
    if (expWords > 200) {
      setError(`Experience message: ${expWords} words. Maximum is 200 words.`);
      return;
    }

    // === DEMO MODE ===
    if (isDemo) {
      const result = requestDemoQuote({
        id: job.id,
        homeowner_id: job.homeowner_id,
        title: job.title,
        category: job.category,
        description: job.description || '',
        region: job.region,
        location: '',
        budget_min: job.budget_min || 0,
        budget_max: job.budget_max || 0,
        status: job.status,
        created_at: new Date().toISOString(),
      });
      if (!result.success) {
        setError(result.error || 'Failed to request quote.');
        return;
      }
      setSuccess('Demo request submitted! The project owner will review your request.');
      setTimeout(() => navigate('/dashboard/tradesperson'), 1500);
      return;
    }

    // === LIVE MODE ===
    if (!contractorProfile || !user) return;

    setSubmitting(true);

    try {
      const existing = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('contractor_id', contractorProfile.id)
        .maybeSingle();

      if (existing.data) {
        setError('You have already requested a quote for this job.');
        setSubmitting(false);
        return;
      }

      if (job.homeowner_id === user.id) {
        setError('You cannot apply to your own job.');
        setSubmitting(false);
        return;
      }

      const { error: appError } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          contractor_id: contractorProfile.id,
          interest_message: interestMessage.trim(),
          experience_message: experienceMessage.trim(),
          status: 'requested',
        });

      if (appError) throw appError;

      const contractorName = profile?.full_name || 'A tradesperson';
      await supabase
        .from('notifications')
        .insert({
          user_id: job.homeowner_id,
          title: 'New Quote Request',
          message: `${contractorName} has requested to quote on your job "${job.title}". Review their request in your dashboard.`,
          is_read: false,
          sender_name: 'BuildGuyana System',
        });

      setSuccess('Request submitted! The project owner will review your profile and invite you to submit a quote if selected.');
      setTimeout(() => {
        navigate('/dashboard/tradesperson');
      }, 3000);
    } catch (err) {
      console.error('Request quote error:', err);
      setError('Failed to submit request. Please try again.');
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

  if (notFound || !job) {
    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
              <i className="ri-file-search-line text-3xl text-foreground-400" />
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">
              {error || 'Job Not Available'}
            </h2>
            <p className="text-sm text-foreground-600 mb-4">This job may have been closed, removed, or is your own job.</p>
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
            <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">Request to Quote</h1>
            {isDemo && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                DEMO
              </span>
            )}
          </div>
          <p className="text-sm text-foreground-600 mb-8">
            Tell the project owner why you are the right fit. This step is free — no credits deducted.
          </p>

          {/* Job Summary Card */}
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
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-check-double-line text-green-600 text-sm" />
              </div>
              <p className="text-xs text-green-700 font-medium">This request is FREE — no credits deducted</p>
            </div>
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

          {alreadyRequested && !success && (
            <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-md text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
                <i className="ri-time-line text-xl text-amber-600" />
              </div>
              <h3 className="font-heading text-base text-foreground-900 mb-1">Request Already Submitted</h3>
              <p className="text-sm text-foreground-600 mb-4">
                You have already requested to quote on this job. The project owner will review your request and invite you to submit a quote if selected.
              </p>
              <button
                onClick={() => navigate('/dashboard/tradesperson')}
                className="px-4 py-2 bg-primary-500 text-background-50 text-sm font-label font-medium rounded-md hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {!success && !alreadyRequested && (
            <form onSubmit={handleSubmit} className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
              <div className="mb-5">
                <label htmlFor="interest" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Why are you interested in this job? <span className="text-foreground-400 font-normal">(Advised)</span>
                </label>
                <p className="text-xs text-foreground-500 mb-2">Max 200 words. Be genuine and specific — project owners appreciate thoughtful responses.</p>
                <textarea
                  id="interest"
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
                  placeholder="e.g. I have done similar fencing projects in Region 6 and have the materials ready to start within a week..."
                />
                <p className="text-xs text-foreground-400 mt-1">
                  {interestMessage.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="experience" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Briefly describe your relevant experience <span className="text-foreground-400 font-normal">(Advised)</span>
                </label>
                <p className="text-xs text-foreground-500 mb-2">Max 200 words. Highlight specific projects or skills that make you a great fit.</p>
                <textarea
                  id="experience"
                  value={experienceMessage}
                  onChange={(e) => setExperienceMessage(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
                  placeholder="e.g. I have 8 years of experience in fence installation across Regions 4 and 6. My team completed 20+ chainlink fences last year..."
                />
                <p className="text-xs text-foreground-400 mt-1">
                  {experienceMessage.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>

              <div className="mb-6 p-3 bg-background-100 border border-background-200/70 rounded-md">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-information-line text-foreground-500" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground-700 leading-relaxed">
                      <strong>What happens next:</strong> The project owner reviews your request. If approved, you will be invited to submit a detailed quote — at which point credits are deducted. Your contact info is only shared if you are hired.
                    </p>
                  </div>
                </div>
              </div>

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
                  "Submit Request — It's Free"
                )}
              </button>
              <p className="text-xs text-foreground-400 text-center mt-3">
                No credits deducted at this stage. Credits are only charged when you submit a quote after being approved.
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}