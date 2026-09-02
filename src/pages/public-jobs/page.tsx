import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

interface PublicJob {
  id: string;
  title: string;
  category: string;
  region: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  thumbnail: string | null;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-green-50 text-green-700 border-green-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', className: 'bg-secondary-100 text-secondary-900 border-secondary-200' },
};

function formatGyd(value: number): string {
  return `GYD $${value.toLocaleString('en-US')}`;
}

function budgetSize(min: number, max: number): string {
  if (max <= 299999) return 'Small';
  if (max <= 1999999) return 'Medium';
  return 'Large';
}

// Defensive thumbnail picker — jobs may store photos as an array of URLs.
// If no photos exist (current schema has no photo column), returns null so
// the card renders a category icon placeholder instead.
function pickThumbnail(job: any): string | null {
  const arr = (job.photo_urls || job.photos || job.images) as string[] | undefined;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  return (job.photo_url || job.image_url || null) as string | null;
}

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('id, title, category, region, budget_min, budget_max, status, created_at')
        .in('status', ['open', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      const mapped: PublicJob[] = (data || []).map((job: any) => ({
        ...job,
        thumbnail: pickThumbnail(job),
      }));
      setJobs(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 px-4 md:px-6 pt-20 md:pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-2xl md:text-4xl text-foreground-900">
                Find Construction Jobs
              </h1>
              <p className="text-foreground-600 text-sm mt-1">
                Browse open projects across Guyana posted by homeowners.
              </p>
            </div>
            <Link
              to="/post-job"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-add-line" />
              </div>
              Post a Job
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-white border border-background-200/70 rounded-lg p-10 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent-100 flex items-center justify-center">
                <i className="ri-error-warning-line text-2xl text-accent-700" />
              </div>
              <p className="text-sm text-foreground-700 mb-4">{error}</p>
              <button
                onClick={fetchJobs}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-background-200/70 rounded-lg p-16 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-foreground-100 flex items-center justify-center">
                <i className="ri-briefcase-line text-2xl text-foreground-500" />
              </div>
              <h2 className="font-heading text-base text-foreground-900 mb-2">No Jobs Yet</h2>
              <p className="text-sm text-foreground-500 max-w-md mx-auto mb-6">
                There are no public jobs right now. Be the first to post your construction project.
              </p>
              <Link
                to="/post-job"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-add-line" />
                </div>
                Post a Job
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                const status = STATUS_META[job.status] || {
                  label: job.status,
                  className: 'bg-background-100 text-foreground-700 border-background-200',
                };
                return (
                  <article
                    key={job.id}
                    className="bg-white border border-background-200/70 rounded-lg overflow-hidden flex flex-col"
                  >
                    <div className="h-40 w-full bg-background-100 flex items-center justify-center">
                      {job.thumbnail ? (
                        <img
                          src={job.thumbnail}
                          alt={job.title}
                          title={`${job.title} — ${job.category}`}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center">
                          <i className="ri-briefcase-line text-2xl text-secondary-700" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-label border ${status.className} whitespace-nowrap`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-foreground-500 font-label whitespace-nowrap">
                          {budgetSize(job.budget_min, job.budget_max)} Budget
                        </span>
                      </div>
                      <h2 className="font-heading text-base text-foreground-900 leading-snug mb-1">
                        {job.title}
                      </h2>
                      <p className="text-xs text-foreground-600 mb-3">
                        {job.category}
                      </p>
                      <div className="mt-auto space-y-1.5 text-xs text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            <i className="ri-map-pin-line text-foreground-400" />
                          </div>
                          <span>{job.region}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            <i className="ri-money-dollar-circle-line text-foreground-400" />
                          </div>
                          <span>{formatGyd(job.budget_min)} — {formatGyd(job.budget_max)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}