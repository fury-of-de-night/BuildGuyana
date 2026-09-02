import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { supabase } from '@/lib/supabase';
import { getDisplayName } from '@/lib/userDisplay';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { MilestonesTab } from './components/MilestonesTab';

type TabKey = 'jobs' | 'notifications' | 'shortlist' | 'milestones';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'jobs', label: 'My Jobs', icon: 'ri-briefcase-line' },
  { key: 'milestones', label: 'Milestones', icon: 'ri-flag-2-line' },
  { key: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line' },
  { key: 'shortlist', label: 'Invite to Quote', icon: 'ri-bookmark-line' },
];

interface JobWithStats {
  id: string;
  title: string;
  category: string;
  region: string;
  location: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  quote_count: number;
  request_count: number;
  has_review: boolean;
}

interface LeadContractor {
  contractor_id: string;
  name: string;
  trade: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ShortlistedContractor {
  id: string;
  shortlist_id: string;
  name: string;
  trade: string;
  region: string;
  rating: number;
  review_count: number;
  verified: boolean;
  portfolio_images: string[] | null;
  created_at: string;
}

export default function ProjectOwnerDashboardPage() {
  return (
    <AuthGuard>
      <ProjectOwnerDashboard />
    </AuthGuard>
  );
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'hired', label: 'Hired' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function ProjectOwnerDashboard() {
  const { user, profile } = useAuth();
  const { isDemo, demoRole, demoProfile, demoJobs, demoLeads, demoQuotes, switchDemoRole } = useDemo();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('jobs');
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobWithStats[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistedContractor[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [statusChanging, setStatusChanging] = useState<string | null>(null);
  const [completeConfirm, setCompleteConfirm] = useState<{ jobId: string; jobTitle: string } | null>(null);

  const [reviewModal, setReviewModal] = useState<{ jobId: string; jobTitle: string } | null>(null);
  const [reviewContractors, setReviewContractors] = useState<LeadContractor[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewToast, setReviewToast] = useState('');

  const displayProfile = isDemo ? demoProfile : profile;

  const fetchJobs = useCallback(async () => {
    if (isDemo) {
      // Show demo jobs posted by the demo project owner
      const ownerId = 'demo-owner-001';
      const ownerJobs = demoJobs.filter((j) => j.homeowner_id === ownerId);
      const jobsWithStats: JobWithStats[] = ownerJobs.map((job) => {
        const leadsForJob = demoLeads.filter((l) => l.job_id === job.id);
        const quotesForJob = demoQuotes.filter((q) => q.job_id === job.id);
        return {
          id: job.id,
          title: job.title,
          category: job.category,
          region: job.region,
          location: job.location,
          budget_min: job.budget_min,
          budget_max: job.budget_max,
          status: job.status,
          created_at: job.created_at,
          quote_count: quotesForJob.length,
          request_count: leadsForJob.filter((l) => l.status === 'requested').length,
          has_review: false,
        };
      });
      setJobs(jobsWithStats);
      return;
    }

    if (!user) return;
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('homeowner_id', user.id)
        .order('created_at', { ascending: false });

      if (jobError || !jobData) return;

      const jobsWithStats: JobWithStats[] = await Promise.all(
        jobData.map(async (job: any) => {
          const [quoteResult, requestResult] = await Promise.all([
            supabase
              .from('quotes')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id),
            supabase
              .from('job_applications')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id),
          ]);

          let hasReview = false;
          try {
            const { data: existingReview } = await supabase
              .from('reviews')
              .select('id')
              .eq('job_id', job.id)
              .eq('reviewer_id', user.id)
              .maybeSingle();
            hasReview = !!existingReview;
          } catch {
            hasReview = false;
          }

          return {
            id: job.id,
            title: job.title,
            category: job.category,
            region: job.region,
            location: job.location,
            budget_min: job.budget_min,
            budget_max: job.budget_max,
            status: job.status,
            created_at: job.created_at,
            quote_count: quoteResult.count || 0,
            request_count: requestResult.count || 0,
            has_review: hasReview,
          };
        })
      );
      setJobs(jobsWithStats);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  }, [user, isDemo, demoJobs, demoLeads, demoQuotes]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      await fetchJobs();

      if (isDemo) {
        setNotifications([]);
        setUnreadCount(0);
        setShortlist([]);
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!notifError && notifData) {
        setNotifications(notifData as Notification[]);
        setUnreadCount(notifData.filter((n: any) => !n.is_read).length);
      }

      const { data: shortlistData, error: shortlistError } = await supabase
        .from('shortlists')
        .select('*')
        .eq('homeowner_id', user.id)
        .order('created_at', { ascending: false });

      if (!shortlistError && shortlistData && shortlistData.length > 0) {
        const contractorIds = shortlistData.map((s: any) => s.contractor_id);
        const { data: contractorData } = await supabase
          .from('contractors')
          .select('id, category, region, verified, portfolio_images, rating, review_count, profile_id')
          .in('id', contractorIds);

        if (contractorData) {
          const profileIds = contractorData.map((c: any) => c.profile_id).filter(Boolean);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds);

          const nameMap = new Map((profileData || []).map((p: any) => [p.id, p.full_name]));

          const mapped: ShortlistedContractor[] = contractorData.map((c: any) => {
            const sl = shortlistData.find((s: any) => s.contractor_id === c.id);
            return {
              id: c.id,
              shortlist_id: sl?.id,
              name: nameMap.get(c.profile_id) || 'Tradesperson',
              trade: c.category || 'General',
              region: c.region || 'Guyana',
              rating: c.rating ? parseFloat(c.rating) : 0,
              review_count: c.review_count || 0,
              verified: c.verified === true,
              portfolio_images: c.portfolio_images,
              created_at: sl?.created_at,
            };
          });
          setShortlist(mapped);
        }
      } else {
        setShortlist([]);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, fetchJobs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    if (isDemo) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      return;
    }

    if (newStatus === 'completed') {
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        setCompleteConfirm({ jobId, jobTitle: job.title });
      }
      return;
    }

    setStatusChanging(jobId);
    try {
      await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
    } catch {
      setReviewToast('Failed to update status. Please try again.');
      setTimeout(() => setReviewToast(''), 3000);
    } finally {
      setStatusChanging(null);
    }
  };

  const handleConfirmComplete = async () => {
    if (!completeConfirm) return;
    const { jobId } = completeConfirm;
    setCompleteConfirm(null);

    if (isDemo) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'completed' } : j))
      );
      return;
    }

    setStatusChanging(jobId);
    try {
      await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId);

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'completed' } : j))
      );
    } catch {
      setReviewToast('Failed to mark job as completed. Please try again.');
      setTimeout(() => setReviewToast(''), 3000);
    } finally {
      setStatusChanging(null);
    }
  };

  const handleOpenReview = async (jobId: string, jobTitle: string) => {
    if (isDemo) return;
    setReviewModal({ jobId, jobTitle });
    setReviewRating(0);
    setReviewComment('');
    setSelectedContractorId('');
    setReviewLoading(true);

    try {
      const { data: acceptedQuotes } = await supabase
        .from('quotes')
        .select('contractor_id')
        .eq('job_id', jobId)
        .eq('status', 'accepted');

      if (acceptedQuotes && acceptedQuotes.length > 0) {
        const cIds = [...new Set(acceptedQuotes.map((q: any) => q.contractor_id))];
        const { data: contractors } = await supabase
          .from('contractors')
          .select('id, category, profile_id')
          .in('id', cIds);

        if (contractors && contractors.length > 0) {
          const pIds = contractors.map((c: any) => c.profile_id).filter(Boolean);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', pIds);

          const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

          const mapped: LeadContractor[] = contractors.map((c: any) => ({
            contractor_id: c.id,
            name: nameMap.get(c.profile_id) || 'Tradesperson',
            trade: c.category || 'General',
          }));

          setReviewContractors(mapped);
          if (mapped.length > 0) {
            setSelectedContractorId(mapped[0].contractor_id);
          }
        } else {
          setReviewContractors([]);
        }
      } else {
        setReviewContractors([]);
      }
    } catch {
      setReviewContractors([]);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewModal || reviewRating === 0 || !selectedContractorId) return;
    setReviewSubmitting(true);
    try {
      await supabase
        .from('reviews')
        .insert({
          job_id: reviewModal.jobId,
          reviewer_id: user.id,
          contractor_id: selectedContractorId,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
          is_mock_data: false,
        });

      setJobs((prev) =>
        prev.map((j) =>
          j.id === reviewModal.jobId ? { ...j, has_review: true } : j
        )
      );

      setReviewModal(null);
      setReviewToast('Review submitted successfully! Thank you for your feedback.');
    } catch {
      setReviewToast('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
      setTimeout(() => setReviewToast(''), 4000);
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleRemoveShortlist = async (shortlistId: string, contractorId: string) => {
    await supabase
      .from('shortlists')
      .delete()
      .eq('id', shortlistId);

    setShortlist((prev) => prev.filter((s) => s.id !== contractorId));
  };

  const handleViewRequests = (jobId: string) => {
    navigate(`/jobs/${jobId}/requests`);
  };

  const handleViewQuotes = (jobId: string) => {
    navigate(`/jobs/${jobId}/quotes`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `GYD ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">Open</span>;
      case 'hired':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">Hired</span>;
      case 'in_progress':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">In Progress</span>;
      case 'completed':
        return <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">Completed</span>;
      case 'cancelled':
        return <span className="text-xs px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full font-label whitespace-nowrap">Cancelled</span>;
      default:
        return <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />

      {reviewToast && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[100] bg-foreground-900 text-background-50 rounded-md px-5 py-3 shadow-sm max-w-md text-center ${isDemo ? 'top-28' : 'top-20'}`}>
          <p className="text-sm font-label">{reviewToast}</p>
        </div>
      )}

      <main className={`flex-1 px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-8`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                {displayProfile?.avatar_url ? (
                  <img src={displayProfile.avatar_url} alt={displayProfile?.full_name || 'User'} className="w-10 h-10 rounded-full object-cover border-2 border-background-200/70" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-background-100 border-2 border-background-200/70 flex items-center justify-center">
                    <i className="ri-user-3-line text-lg text-foreground-400" />
                  </div>
                )}
                <div>
                  <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
                    Welcome back, {getDisplayName(displayProfile?.full_name, user?.email)}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-foreground-600 text-sm">Project Owner Dashboard</p>
                    {isDemo && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">DEMO</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isDemo && (
                <button
                  onClick={() => { switchDemoRole(); navigate(demoRole === 'tradesperson' ? '/dashboard/project-owner' : '/dashboard/tradesperson'); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-amber-300/60 text-amber-700 hover:bg-amber-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-arrow-left-right-line" />
                  </div>
                  View {demoRole === 'tradesperson' ? 'Project Owner' : 'Tradesperson'} Dashboard
                </button>
              )}
              <button
                onClick={() => navigate('/post-job')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-add-line" />
                </div>
                Post a New Job
              </button>
            </div>
          </div>

          <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden mb-8">
            <div className="flex border-b border-background-200/70">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-label font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                      : 'text-foreground-600 hover:text-foreground-800 hover:bg-background-50'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={tab.icon} />
                  </div>
                  {tab.label}
                  {tab.key === 'notifications' && unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 rounded-full bg-accent-500 text-background-50 text-[10px] font-bold flex items-center justify-center px-1.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 md:p-6">
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* My Jobs Tab */}
              {!loading && activeTab === 'jobs' && (
                <div>
                  {jobs.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-14 h-14 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
                        <i className="ri-briefcase-line text-foreground-400 text-xl" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-2">No jobs posted yet</h3>
                      <p className="text-sm text-foreground-500 max-w-sm mx-auto mb-4">
                        Post your first job to start receiving quotes from verified tradespeople across Guyana.
                      </p>
                      <button
                        onClick={() => navigate('/post-job')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-add-line" />
                        </div>
                        Post a Job
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground-600 font-label">
                          <strong className="text-foreground-900">{jobs.length}</strong> job{jobs.length !== 1 ? 's' : ''} posted
                        </p>
                      </div>
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className="border border-background-200/70 rounded-lg p-4 md:p-5 hover:border-background-300/60 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-heading text-base md:text-lg font-semibold text-foreground-900">{job.title}</h3>
                                {getStatusBadge(job.status)}
                                {isDemo && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">DEMO</span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-500 font-label">
                                <span className="inline-flex items-center gap-1">
                                  <div className="w-3 h-3 flex items-center justify-center">
                                    <i className="ri-tools-line" />
                                  </div>
                                  {job.category}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <div className="w-3 h-3 flex items-center justify-center">
                                    <i className="ri-map-pin-line" />
                                  </div>
                                  {job.location}, {job.region}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <div className="w-3 h-3 flex items-center justify-center">
                                    <i className="ri-calendar-line" />
                                  </div>
                                  Posted {formatDate(job.created_at)}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 mt-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-foreground-500 font-label whitespace-nowrap">Status:</span>
                                  <div className="relative">
                                    <select
                                      value={job.status}
                                      onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                      disabled={statusChanging === job.id}
                                      className="font-label text-xs px-2.5 py-1.5 rounded-md border border-background-300/60 bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer appearance-none pr-7 min-w-[120px]"
                                    >
                                      {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                    <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-foreground-400 text-xs pointer-events-none" />
                                    {statusChanging === job.id && (
                                      <div className="absolute right-7 top-1/2 -translate-y-1/2">
                                        <div className="w-3 h-3 border border-primary-500 border-t-transparent rounded-full animate-spin" />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                  {job.request_count > 0 && (
                                    <button
                                      onClick={() => handleViewRequests(job.id)}
                                      className="inline-flex items-center gap-1.5 text-xs font-label font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      <div className="w-3.5 h-3.5 flex items-center justify-center">
                                        <i className="ri-user-voice-line" />
                                      </div>
                                      View {job.request_count} Request{job.request_count !== 1 ? 's' : ''}
                                    </button>
                                  )}
                                  {job.quote_count > 0 && (
                                    <button
                                      onClick={() => handleViewQuotes(job.id)}
                                      className="inline-flex items-center gap-1.5 text-xs font-label font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      <div className="w-3.5 h-3.5 flex items-center justify-center">
                                        <i className="ri-file-list-3-line" />
                                      </div>
                                      View {job.quote_count} Quote{job.quote_count !== 1 ? 's' : ''}
                                    </button>
                                  )}
                                </div>

                                {['hired', 'accepted', 'in_progress', 'completed'].includes(job.status) && !job.has_review && (
                                  <button
                                    onClick={() => handleOpenReview(job.id, job.title)}
                                    className="inline-flex items-center gap-1.5 text-xs font-label font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                                      <i className="ri-star-line" />
                                    </div>
                                    Leave a Review
                                  </button>
                                )}

                                {['hired', 'accepted', 'in_progress', 'completed'].includes(job.status) && job.has_review && (
                                  <span className="inline-flex items-center gap-1 text-xs text-foreground-400 font-label whitespace-nowrap">
                                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                                      <i className="ri-check-double-line" />
                                    </div>
                                    Reviewed
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="font-heading text-lg font-bold text-foreground-900">{job.quote_count}</p>
                                <p className="text-xs text-foreground-500 font-label">Quote{job.quote_count !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-label text-sm font-semibold text-foreground-900 whitespace-nowrap">
                                  {formatCurrency(job.budget_min)} - {formatCurrency(job.budget_max)}
                                </p>
                                <p className="text-xs text-foreground-400">Budget Range</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {!loading && activeTab === 'notifications' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-foreground-600 font-label">
                      <strong className="text-foreground-900">{notifications.length}</strong> notification{notifications.length !== 1 ? 's' : ''}
                      {unreadCount > 0 && <span className="text-accent-600"> &middot; {unreadCount} unread</span>}
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-label text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-14 h-14 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
                        <i className="ri-notification-3-line text-foreground-400 text-xl" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-2">No notifications yet</h3>
                      <p className="text-sm text-foreground-500 max-w-sm mx-auto">
                        You'll get notified when tradespeople submit quotes or interact with your posts.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            notif.is_read
                              ? 'border-background-200/70 bg-background-50'
                              : 'border-primary-200/60 bg-primary-50/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {!notif.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                                )}
                                <h4 className="font-label text-sm font-semibold text-foreground-900">{notif.title}</h4>
                              </div>
                              <p className="text-sm text-foreground-600 leading-relaxed">{notif.message}</p>
                              <p className="text-xs text-foreground-400 mt-1.5">{formatDate(notif.created_at)}</p>
                            </div>
                            {!notif.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="flex-shrink-0 text-xs font-label text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Invite to Quote Tab */}
              {!loading && activeTab === 'shortlist' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-foreground-600 font-label">
                      <strong className="text-foreground-900">{shortlist.length}</strong> tradesperson{shortlist.length !== 1 ? 's' : ''} saved
                    </p>
                  </div>

                  {shortlist.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-14 h-14 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
                        <i className="ri-bookmark-line text-foreground-400 text-xl" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-2">No saved tradespeople</h3>
                      <p className="text-sm text-foreground-500 max-w-sm mx-auto mb-4">
                        Browse tradespeople and save your favorites to invite them to quote on your jobs.
                      </p>
                      <button
                        onClick={() => navigate('/contractors')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-search-line" />
                        </div>
                        Browse Tradespeople
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shortlist.map((item) => (
                        <div
                          key={item.id}
                          className="border border-background-200/70 rounded-lg p-4 flex flex-col sm:flex-row items-start gap-4 hover:border-background-300/60 transition-colors"
                        >
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-background-100">
                            {item.portfolio_images && item.portfolio_images.length > 0 ? (
                              <img
                                src={item.portfolio_images[0]}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-user-3-line text-foreground-400 text-xl" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <button
                                onClick={() => navigate(`/contractors/${item.id}`)}
                                className="font-heading text-sm font-semibold text-foreground-900 hover:text-primary-600 transition-colors cursor-pointer text-left"
                              >
                                {item.name}
                              </button>
                              {item.verified && (
                                <span className="text-xs px-1.5 py-0.5 bg-accent-100 text-accent-700 rounded-full font-label font-semibold whitespace-nowrap">
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-500 font-label">{item.trade} &middot; {item.region}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 flex items-center justify-center">
                                  <i className="ri-star-fill text-amber-500 text-xs" />
                                </div>
                                <span className="font-label text-xs font-semibold text-foreground-800">{item.rating.toFixed(1)}</span>
                                <span className="text-xs text-foreground-400">({item.review_count})</span>
                              </div>
                              <span className="text-xs text-foreground-400">Saved {formatDate(item.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => navigate(`/contractors/${item.id}`)}
                              className="px-3 py-1.5 text-xs font-label font-medium text-primary-600 border border-primary-200/60 rounded-md hover:bg-primary-50 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => handleRemoveShortlist(item.shortlist_id, item.id)}
                              className="px-3 py-1.5 text-xs font-label font-medium text-foreground-600 border border-background-200/70 rounded-md hover:bg-accent-50 hover:text-accent-700 hover:border-accent-200/60 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <i className="ri-delete-bin-line" />
                              </div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Milestones Tab */}
              {!loading && activeTab === 'milestones' && (
                <MilestonesTab />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {completeConfirm && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground-900/40 backdrop-blur-sm" onClick={() => setCompleteConfirm(null)} />
          <div className="relative bg-white border border-background-200/70 rounded-lg w-full max-w-sm p-6 shadow-lg">
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <i className="ri-check-double-line text-amber-600 text-xl" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground-900 mb-1">Confirm Completion</h3>
              <p className="text-sm text-foreground-600 leading-relaxed">
                Are you sure <strong className="text-foreground-900">"{completeConfirm.jobTitle}"</strong> is finished? Only confirm if the work has been fully completed to your satisfaction.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setCompleteConfirm(null)}
                className="flex-1 py-2.5 px-4 text-sm font-label font-medium text-foreground-700 border border-background-200/70 rounded-md hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap order-2 sm:order-1"
              >
                Not yet, go back
              </button>
              <button
                onClick={handleConfirmComplete}
                className="flex-1 py-2.5 px-4 text-sm font-label font-medium bg-accent-500 hover:bg-accent-600 text-background-50 rounded-md transition-colors cursor-pointer whitespace-nowrap order-1 sm:order-2"
              >
                Yes, mark as completed
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground-900/40 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative bg-white border border-background-200/70 rounded-lg w-full max-w-md p-6 shadow-lg">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground-900">Leave a Review</h3>
                <p className="text-xs text-foreground-500 mt-0.5">Job: {reviewModal.jobTitle}</p>
              </div>
              <button
                onClick={() => setReviewModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-foreground-600" />
              </button>
            </div>

            {reviewLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviewContractors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-foreground-600 mb-4">
                  No hired contractor found for this job. You can only review contractors you have hired.
                </p>
                <button
                  onClick={() => setReviewModal(null)}
                  className="px-4 py-2 text-sm font-label font-medium text-foreground-600 border border-background-200/70 rounded-md hover:bg-background-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <label className="block text-xs font-label font-semibold text-foreground-700 mb-1.5">Who did the work?</label>
                  <div className="relative">
                    <select
                      value={selectedContractorId}
                      onChange={(e) => setSelectedContractorId(e.target.value)}
                      className="font-label text-sm w-full px-3 py-2.5 rounded-md border border-background-300/60 bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer appearance-none pr-8"
                    >
                      {reviewContractors.map((c) => (
                        <option key={c.contractor_id} value={c.contractor_id}>
                          {c.name} — {c.trade}
                        </option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-500 text-sm pointer-events-none" />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-label font-semibold text-foreground-700 mb-2">Your Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <i
                          className={`text-2xl ${
                            star <= reviewRating
                              ? 'ri-star-fill text-amber-500'
                              : 'ri-star-line text-foreground-300 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="ml-2 text-sm font-label font-semibold text-foreground-800">
                        {reviewRating}/5
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-label font-semibold text-foreground-700 mb-1.5">
                    Your Review <span className="text-foreground-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience working with this tradesperson..."
                    maxLength={500}
                    rows={4}
                    className="font-label text-sm w-full px-3 py-2.5 rounded-md border border-background-300/60 bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 resize-none"
                  />
                  <p className="text-xs text-foreground-400 mt-1 text-right">{reviewComment.length}/500</p>
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || !selectedContractorId || reviewSubmitting}
                  className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-background-200 disabled:text-foreground-400 disabled:cursor-not-allowed text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  {reviewSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}