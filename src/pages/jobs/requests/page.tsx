import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

interface ApplicationWithContractor {
  id: string;
  contractor_id: string;
  contractor_name: string;
  contractor_trade: string;
  contractor_avatar: string | null;
  contractor_rating: number;
  contractor_reviews: number;
  contractor_years: number;
  contractor_verified: boolean;
  contractor_verification_status: string;
  interest_message: string | null;
  experience_message: string | null;
  status: string;
  created_at: string;
  has_quote: boolean;
}

interface JobInfo {
  id: string;
  title: string;
  category: string;
  region: string;
  status: string;
  homeowner_id: string;
}

export default function JobRequestsPage() {
  return (
    <AuthGuard requiredRole="project_owner">
      <JobRequests />
    </AuthGuard>
  );
}

function JobRequests() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo, demoJobs, demoLeads, demoQuotes, approveDemoRequest } = useDemo();

  const [job, setJob] = useState<JobInfo | null>(null);
  const [requests, setRequests] = useState<ApplicationWithContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'requested' | 'approved' | 'rejected'>('all');

  const [toast, setToast] = useState('');

  const fetchData = useCallback(async () => {
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
          region: demoJob.region,
          status: demoJob.status,
          homeowner_id: demoJob.homeowner_id,
        });

        // Build applications from demoLeads for this job
        const jobLeads = demoLeads.filter((l) => l.job_id === jobId);
        const apps: ApplicationWithContractor[] = jobLeads.map((lead) => ({
          id: lead.id,
          contractor_id: lead.contractor_id || 'demo-contractor-001',
          contractor_name: 'Rajesh Singh',
          contractor_trade: 'House Construction',
          contractor_avatar: null,
          contractor_rating: 4.8,
          contractor_reviews: 42,
          contractor_years: 10,
          contractor_verified: true,
          contractor_verification_status: 'verified',
          interest_message: 'I am highly interested in this job and available immediately.',
          experience_message: 'I have 5 years of professional plumbing experience in Region 4.',
          status: lead.status,
          created_at: lead.unlocked_at,
          has_quote: demoQuotes.some((q) => q.job_id === jobId && q.contractor_id === (lead.contractor_id || 'demo-contractor-001')),
        }));

        setRequests(apps);
        setLoading(false);
        return;
      }

      // === LIVE MODE ===
      if (!user) {
        setLoading(false);
        return;
      }

      const jobResult = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('homeowner_id', user.id)
        .maybeSingle();

      if (jobResult.error || !jobResult.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setJob(jobResult.data as JobInfo);

      const appsResult = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (!appsResult.data || appsResult.data.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const apps = appsResult.data;
      const contractorIds = apps.map((a: any) => a.contractor_id);
      const contractorsResult = await supabase
        .from('contractors')
        .select('id, profile_id, category, years_experience, rating, review_count, verified, verification_status')
        .in('id', contractorIds);

      const contractorsMap = new Map<string, any>();
      (contractorsResult.data || []).forEach((c: any) => {
        contractorsMap.set(c.id, c);
      });

      const profileIds = (contractorsResult.data || []).map((c: any) => c.profile_id).filter(Boolean);
      const profilesResult = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', profileIds);

      const profilesMap = new Map<string, any>();
      (profilesResult.data || []).forEach((p: any) => {
        profilesMap.set(p.id, p);
      });

      const quoteResult = await supabase
        .from('quotes')
        .select('contractor_id')
        .eq('job_id', jobId);
      const quotedContractorIds = new Set((quoteResult.data || []).map((q: any) => q.contractor_id));

      const merged: ApplicationWithContractor[] = apps.map((a: any) => {
        const contractor = contractorsMap.get(a.contractor_id);
        const prof = contractor ? profilesMap.get(contractor.profile_id) : null;
        return {
          id: a.id,
          contractor_id: a.contractor_id,
          contractor_name: prof?.full_name || 'Tradesperson',
          contractor_trade: contractor?.category || 'General',
          contractor_avatar: prof?.avatar_url || null,
          contractor_rating: contractor?.rating ? parseFloat(contractor.rating) : 0,
          contractor_reviews: contractor?.review_count || 0,
          contractor_years: contractor?.years_experience || 0,
          contractor_verified: contractor?.verified === true,
          contractor_verification_status: contractor?.verification_status || 'pending',
          interest_message: a.interest_message,
          experience_message: a.experience_message,
          status: a.status,
          created_at: a.created_at,
          has_quote: quotedContractorIds.has(a.contractor_id),
        };
      });

      setRequests(merged);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [jobId, user, isDemo, demoJobs, demoLeads, demoQuotes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (app: ApplicationWithContractor) => {
    if (isDemo) {
      approveDemoRequest(jobId!, app.contractor_id);
      setRequests((prev) =>
        prev.map((r) => (r.id === app.id ? { ...r, status: 'approved' } : r))
      );
      setToast(`${app.contractor_name} has been approved to submit a quote.`);
      setTimeout(() => setToast(''), 4000);
      return;
    }

    try {
      const { count: approvedCount, error: countError } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId)
        .eq('status', 'approved');

      if (countError) throw countError;

      if ((approvedCount || 0) >= 3) {
        setToast('Maximum of 3 contractors reached for this job.');
        setTimeout(() => setToast(''), 4000);
        return;
      }

      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'approved' })
        .eq('id', app.id);

      if (error) throw error;

      const { data: contractor } = await supabase
        .from('contractors')
        .select('profile_id')
        .eq('id', app.contractor_id)
        .maybeSingle();

      if (contractor?.profile_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: contractor.profile_id,
            title: 'Quote Request Approved!',
            message: `Great news! Your request to quote on "${job?.title}" has been approved. You can now submit your detailed quote.`,
            is_read: false,
            sender_name: 'BuildGuyana System',
          });
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === app.id ? { ...r, status: 'approved' } : r))
      );

      setToast(`${app.contractor_name} has been approved to submit a quote.`);
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      console.error('Failed to approve:', err);
      setToast('Failed to approve. Please try again.');
      setTimeout(() => setToast(''), 4000);
    }
  };

  const handleReject = async (app: ApplicationWithContractor) => {
    if (isDemo) {
      setRequests((prev) =>
        prev.map((r) => (r.id === app.id ? { ...r, status: 'rejected' } : r))
      );
      setToast(`${app.contractor_name}'s request has been declined.`);
      setTimeout(() => setToast(''), 4000);
      return;
    }

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'rejected' })
        .eq('id', app.id);

      if (error) throw error;

      const { data: contractor } = await supabase
        .from('contractors')
        .select('profile_id')
        .eq('id', app.contractor_id)
        .maybeSingle();

      if (contractor?.profile_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: contractor.profile_id,
            title: 'Quote Request Not Selected',
            message: `Thank you for your interest. The project owner has decided not to proceed with your request for "${job?.title}".`,
            is_read: false,
            sender_name: 'BuildGuyana System',
          });
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === app.id ? { ...r, status: 'rejected' } : r))
      );

      setToast(`${app.contractor_name}'s request has been declined.`);
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      console.error('Failed to reject:', err);
      setToast('Failed to reject. Please try again.');
      setTimeout(() => setToast(''), 4000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">Pending</span>;
      case 'approved':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">Approved</span>;
      case 'rejected':
        return <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-500 rounded-full font-label whitespace-nowrap">Declined</span>;
      case 'quote_submitted':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">Quote Submitted</span>;
      default:
        return null;
    }
  };

  const filteredRequests = activeFilter === 'all'
    ? requests
    : requests.filter((r) => r.status === activeFilter);

  const counts = {
    all: requests.length,
    requested: requests.filter((r) => r.status === 'requested').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
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
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
              <i className="ri-file-search-line text-3xl text-foreground-400" />
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">Job Not Found</h2>
            <p className="text-sm text-foreground-600 mb-4">This job doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/dashboard/project-owner')}
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

      {toast && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[100] bg-foreground-900 text-background-50 rounded-md px-5 py-3 shadow-sm max-w-md text-center ${isDemo ? 'top-28' : 'top-20'}`}>
          <p className="text-sm font-label">{toast}</p>
        </div>
      )}

      <main className={`flex-1 px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-8`}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/dashboard/project-owner')}
            className="inline-flex items-center gap-2 text-sm font-label text-foreground-600 hover:text-foreground-900 transition-colors cursor-pointer mb-6"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-left-line" />
            </div>
            Back to Dashboard
          </button>

          <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">
                {job.category}
              </span>
              <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">
                {job.region}
              </span>
              {isDemo && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">DEMO</span>
              )}
            </div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-1">{job.title}</h1>
            <div className="flex items-center gap-4 text-xs text-foreground-600 mt-2">
              <span><strong className="text-foreground-900">{counts.requested}</strong> pending request{counts.requested !== 1 ? 's' : ''}</span>
              <span><strong className="text-foreground-900">{counts.approved}</strong> approved</span>
              <span><strong className="text-foreground-900">{counts.rejected}</strong> declined</span>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-16 bg-white border border-background-200/70 rounded-lg">
              <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                <i className="ri-file-list-3-line text-3xl text-foreground-400" />
              </div>
              <h3 className="font-heading text-lg text-foreground-900 mb-2">No Quote Requests Yet</h3>
              <p className="text-sm text-foreground-500 max-w-sm mx-auto">
                Tradespeople haven't requested to quote on this job yet. Check back later.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-1 mb-4 bg-background-100 rounded-lg p-1 w-fit">
                {(['all', 'requested', 'approved', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 text-xs font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      activeFilter === f
                        ? 'bg-white text-foreground-900 shadow-sm'
                        : 'text-foreground-500 hover:text-foreground-700'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'requested' ? 'Pending' : f === 'approved' ? 'Approved' : 'Declined'}
                    {counts[f] > 0 && <span className="ml-1 text-foreground-400">({counts[f]})</span>}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <button
                  onClick={() => navigate(`/jobs/${jobId}/quotes`)}
                  className="inline-flex items-center gap-1.5 text-xs font-label font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    <i className="ri-file-list-3-line" />
                  </div>
                  View Submitted Quotes
                </button>
              </div>

              <div className="space-y-4">
                {filteredRequests.map((app) => (
                  <div
                    key={app.id}
                    className={`bg-white border rounded-lg p-4 md:p-5 ${
                      app.status === 'approved'
                        ? 'border-green-300/60 bg-green-50/30'
                        : app.status === 'rejected'
                          ? 'border-background-200/70 opacity-60'
                          : 'border-background-200/70 hover:border-background-300/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-background-100 border border-background-200/70 flex-shrink-0">
                          {app.contractor_avatar ? (
                            <img src={app.contractor_avatar} alt={app.contractor_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="ri-user-3-line text-foreground-400 text-lg" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading text-sm font-semibold text-foreground-900">
                              {app.contractor_name}
                            </span>
                            {getStatusBadge(app.status)}
                            {isDemo && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">DEMO</span>
                            )}
                            {app.contractor_verified && (
                              <span className="text-xs px-1.5 py-0.5 bg-accent-100 text-accent-700 rounded-full font-label whitespace-nowrap">Verified</span>
                            )}
                          </div>
                          <p className="text-xs text-foreground-500">{app.contractor_trade} &middot; {app.contractor_years} yrs</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex items-center gap-0.5">
                              <i className="ri-star-fill text-amber-500 text-xs" />
                              <span className="text-xs font-semibold text-foreground-800">{app.contractor_rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-foreground-400">({app.contractor_reviews})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {app.status === 'requested' && (
                          <>
                            <button
                              onClick={() => handleApprove(app)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-background-50 text-xs font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(app)}
                              className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {app.status === 'approved' && !app.has_quote && (
                          <span className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md font-label font-medium whitespace-nowrap">
                            Awaiting Quote
                          </span>
                        )}
                        {app.status === 'approved' && app.has_quote && (
                          <span className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md font-label font-medium whitespace-nowrap">
                            Quote Submitted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 pt-3 border-t border-background-200/70">
                      <div className="bg-background-50 rounded-md p-3">
                        <p className="text-xs text-foreground-500 font-label mb-1">Why they're interested:</p>
                        <p className="text-sm text-foreground-700 leading-relaxed">{app.interest_message || 'No message provided.'}</p>
                      </div>
                      <div className="bg-background-50 rounded-md p-3">
                        <p className="text-xs text-foreground-500 font-label mb-1">Relevant experience:</p>
                        <p className="text-sm text-foreground-700 leading-relaxed">{app.experience_message || 'No message provided.'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}