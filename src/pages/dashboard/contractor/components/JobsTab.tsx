import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext';
import { REGIONS } from '@/mocks/locations';

interface Job {
  id: string;
  homeowner_id: string;
  title: string;
  category: string;
  description: string | null;
  region: string;
  location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  created_at: string;
}

interface JobsTabProps {
  contractorId: string;
  contractorName: string;
  walletBalance: number;
  walletId: string | null;
  onBalanceChange: () => void;
}

const CATEGORIES = [
  'House Construction',
  'Fencing & Gates',
  'Culverts & Drains',
  'Concrete Works',
  'Roofing',
  'Welding & Fabrication',
  'Land Clearing',
  'Machinery Rental',
  'Material Supply',
  'General Contractor',
  'Plumbing',
];

function getLeadCostCredits(budgetMin: number | null, budgetMax: number | null): number {
  const maxBudget = budgetMax || budgetMin || 0;
  if (maxBudget >= 2000000) return 5;
  if (maxBudget >= 300000) return 3;
  return 1;
}

export function JobsTab({ contractorId, contractorName, walletBalance, walletId, onBalanceChange }: JobsTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo, demoJobs, demoUnlockedJobIds, requestDemoQuote } = useDemo();
  const { getCreditToGyd } = usePlatformSettings();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [submittedJobIds, setSubmittedJobIds] = useState<Set<string>>(new Set());
  const [requestedJobIds, setRequestedJobIds] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // === DEMO MODE ===
      if (isDemo) {
        let results = demoJobs.filter((j) => j.status === 'open') as unknown as Job[];
        if (filterRegion) {
          results = results.filter((j) => j.region === filterRegion);
        }
        if (filterCategory) {
          results = results.filter((j) => j.category === filterCategory);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          results = results.filter((j) =>
            (j.title && j.title.toLowerCase().includes(q)) ||
            (j.category && j.category.toLowerCase().includes(q)) ||
            (j.description && j.description.toLowerCase().includes(q))
          );
        }
        setJobs(results);
        setRequestedJobIds(demoUnlockedJobIds);
        setLoading(false);
        return;
      }

      // === LIVE MODE ===
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (filterRegion) {
        query = query.eq('region', filterRegion);
      }
      if (filterCategory) {
        query = query.eq('category', filterCategory);
      }

      const queryResult = await query;
      if (queryResult.error) throw queryResult.error;

      let results = (queryResult.data || []) as Job[];

      if (filterRegion) {
        results = results.filter((job) => job.region === filterRegion);
      }
      if (filterCategory) {
        results = results.filter((job) => job.category === filterCategory);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        results = results.filter((job: Job) =>
          (job.title && job.title.toLowerCase().includes(q)) ||
          (job.category && job.category.toLowerCase().includes(q)) ||
          (job.description && job.description.toLowerCase().includes(q))
        );
      }

      setJobs(results);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [isDemo, demoJobs, demoUnlockedJobIds, filterRegion, filterCategory, searchQuery]);

  const fetchSubmittedQuotes = useCallback(async () => {
    if (isDemo || !contractorId) return;
    try {
      const quotesResult = await supabase
        .from('quotes')
        .select('job_id')
        .eq('contractor_id', contractorId);
      if (quotesResult.data) {
        setSubmittedJobIds(new Set(quotesResult.data.map((q) => q.job_id)));
      }
    } catch (err) {
      console.error('Failed to fetch submitted quotes:', err);
    }
  }, [contractorId, isDemo]);

  const fetchRequestedJobs = useCallback(async () => {
    if (isDemo || !contractorId) return;
    try {
      const appsResult = await supabase
        .from('job_applications')
        .select('job_id, status')
        .eq('contractor_id', contractorId);
      if (appsResult.data) {
        const requested = new Set(appsResult.data.map((a) => a.job_id));
        setRequestedJobIds(requested);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  }, [contractorId, isDemo]);

  useEffect(() => {
    fetchJobs();
    fetchSubmittedQuotes();
    fetchRequestedJobs();
  }, [fetchJobs, fetchSubmittedQuotes, fetchRequestedJobs]);

  const handleRequestQuote = (job: Job) => {
    if (isDemo) {
      const result = requestDemoQuote({
        id: job.id,
        homeowner_id: job.homeowner_id,
        title: job.title,
        category: job.category,
        description: job.description || '',
        region: job.region,
        location: job.location || '',
        budget_min: job.budget_min || 0,
        budget_max: job.budget_max || 0,
        status: job.status,
        created_at: job.created_at,
      });
      if (result.success) {
        navigate(`/request-quote/${job.id}`);
      }
    } else {
      navigate(`/request-quote/${job.id}`);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) return `GYD ${min.toLocaleString()} — ${max.toLocaleString()}`;
    if (min) return `From GYD ${min.toLocaleString()}`;
    if (max) return `Up to GYD ${max.toLocaleString()}`;
    return 'Not specified';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-3 flex items-center">
            <i className="ri-search-line text-foreground-400 text-sm" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs by title, category, or description..."
            className="font-label text-sm w-full pl-9 pr-4 py-2.5 rounded-md border border-background-200/70 bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer shrink-0"
        >
          <option value="">All Regions</option>
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer shrink-0"
        >
          <option value="">{showAllCategories ? 'All Categories' : 'My Trade'}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAllCategories(!showAllCategories)}
          className={`w-full sm:w-auto px-4 py-2.5 text-sm border rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0 ${showAllCategories ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-background-200/70 text-foreground-600 hover:bg-background-100'}`}
        >
          {showAllCategories ? 'Showing All' : 'Show All Jobs'}
        </button>
        <button
          onClick={() => { setFilterRegion(''); setFilterCategory(''); setSearchQuery(''); setShowAllCategories(false); }}
          className="w-full sm:w-auto px-4 py-2.5 text-sm border border-background-200/70 text-foreground-600 rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer shrink-0"
        >
          Clear
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-background-50 border border-background-200/70 rounded-lg">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-briefcase-line text-3xl text-foreground-400" />
          </div>
          <p className="text-foreground-600 text-sm font-label">No open jobs found.</p>
          <p className="text-foreground-500 text-xs mt-1">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isSubmitted = submittedJobIds.has(job.id);
            const isRequested = requestedJobIds.has(job.id);
            const isOwnJob = job.homeowner_id === (user?.id || '');
            const leadCost = getLeadCostCredits(job.budget_min, job.budget_max);
            return (
              <div
                key={job.id}
                className="border border-background-200/70 rounded-lg p-4 md:p-5 hover:border-background-300/60 transition-colors bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
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
                    <h4 className="font-heading text-base text-foreground-900 mb-1">{job.title}</h4>
                    {job.description && (
                      <p className="text-sm text-foreground-600 line-clamp-2 mb-2">{job.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-500">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-map-pin-line" />
                        </div>
                        {job.region} (Region only)
                      </span>
                      <span className="font-medium text-foreground-700">
                        {formatBudget(job.budget_min, job.budget_max)}
                      </span>
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isOwnJob ? (
                      <span className="text-xs px-3 py-1.5 bg-background-100 text-foreground-500 rounded-md font-label font-medium whitespace-nowrap">
                        You cannot request a quote for your own job
                      </span>
                    ) : isSubmitted ? (
                      <span className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md font-label font-medium whitespace-nowrap">
                        Quote Submitted
                      </span>
                    ) : isRequested ? (
                      <span className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md font-label font-medium whitespace-nowrap">
                        Request Pending
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-foreground-500 whitespace-nowrap">Shortlisting will cost</span>
                        <span className="text-xs font-semibold text-foreground-900 font-label whitespace-nowrap">
                          {leadCost} Credit{leadCost !== 1 ? 's' : ''} (GYD ${(leadCost * 500).toLocaleString()})
                        </span>
                        <button
                          onClick={() => handleRequestQuote(job)}
                          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <div className="w-3.5 h-3.5 flex items-center justify-center">
                            <i className="ri-chat-quote-line" />
                          </div>
                          Request to Quote
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}