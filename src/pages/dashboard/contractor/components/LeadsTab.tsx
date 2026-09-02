import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoModeContext';

interface QuoteWithJob {
  id: string;
  job_id: string;
  proposed_price: number;
  estimated_timeline: string;
  status: string;
  created_at: string;
  job_title: string;
  job_category: string;
  job_region: string;
  budget_min: number | null;
  budget_max: number | null;
  application_status?: string;
  contractor_name?: string;
}

interface JobApplication {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  job_title: string;
  job_category: string;
  job_region: string;
}

const DISPUTE_REASONS = [
  'Disconnected Number',
  'Outside Service Area',
  'Homeowner Ghosted',
  'Wrong Trade',
];

function getLeadCostCredits(budgetMin: number | null, budgetMax: number | null): number {
  const maxBudget = budgetMax || budgetMin || 0;
  if (maxBudget >= 2000000) return 5;
  if (maxBudget >= 300000) return 3;
  return 1;
}

interface LeadsTabProps {
  contractorId: string;
}

export function LeadsTab({ contractorId }: LeadsTabProps) {
  const navigate = useNavigate();
  const { isDemo, demoLeads, demoQuotes } = useDemo();
  const [quotes, setQuotes] = useState<QuoteWithJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'requested' | 'approved' | 'quote_submitted' | 'accepted' | 'rejected'>('all');

  const [disputeItem, setDisputeItem] = useState<QuoteWithJob | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputing, setDisputing] = useState(false);
  const [disputeToast, setDisputeToast] = useState('');

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      // === DEMO MODE ===
      if (isDemo) {
        // Build quotes from demoQuotes
        const demoQuoteItems: QuoteWithJob[] = demoQuotes.map((q) => ({
          id: q.id,
          job_id: q.job_id,
          proposed_price: q.proposed_price,
          estimated_timeline: q.estimated_timeline,
          status: q.status,
          created_at: q.created_at,
          job_title: q.job_id,
          job_category: '',
          job_region: '',
          budget_min: null,
          budget_max: null,
          contractor_name: q.contractor_name,
        }));

        // Find job titles for quotes
        const allDemoQuotes = demoQuoteItems.map((q) => {
          const lead = demoLeads.find((l) => l.job_id === q.job_id);
          return {
            ...q,
            job_title: lead?.job_title || 'Demo Job',
            job_category: lead?.job_category || '',
            job_region: lead?.job_region || '',
          };
        });

        // Build applications from demoLeads
        const demoApps: JobApplication[] = demoLeads.map((lead) => ({
          id: lead.id,
          job_id: lead.job_id,
          status: lead.status,
          created_at: lead.unlocked_at,
          job_title: lead.job_title,
          job_category: lead.job_category,
          job_region: lead.job_region,
        }));

        setQuotes(allDemoQuotes);
        setApplications(demoApps);
        setLoading(false);
        return;
      }

      // === LIVE MODE ===
      if (!contractorId) {
        setLoading(false);
        return;
      }

      const quotesResult = await supabase
        .from('quotes')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      let quoteData: QuoteWithJob[] = [];
      if (quotesResult.data && quotesResult.data.length > 0) {
        const jobIds = quotesResult.data.map((q) => q.job_id);
        const jobsResult = await supabase
          .from('jobs')
          .select('id, title, category, region, budget_min, budget_max')
          .in('id', jobIds);

        const jobMap = new Map(jobsResult.data?.map((j) => [j.id, j]) || []);

        quoteData = quotesResult.data.map((quote) => {
          const job = jobMap.get(quote.job_id);
          return {
            ...quote,
            job_title: job?.title || 'Unknown Job',
            job_category: job?.category || 'Unknown',
            job_region: job?.region || 'Unknown',
            budget_min: job?.budget_min ?? null,
            budget_max: job?.budget_max ?? null,
            status: quote.status === 'submitted' ? 'quote_submitted' : quote.status,
          };
        });
      }

      setQuotes(quoteData);

      const appsResult = await supabase
        .from('job_applications')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      let appData: JobApplication[] = [];
      if (appsResult.data && appsResult.data.length > 0) {
        const appJobIds = appsResult.data.map((a: any) => a.job_id);
        const appJobsResult = await supabase
          .from('jobs')
          .select('id, title, category, region')
          .in('id', appJobIds);

        const appJobMap = new Map(appJobsResult.data?.map((j) => [j.id, j]) || []);

        appData = appsResult.data.map((app: any) => {
          const job = appJobMap.get(app.job_id);
          return {
            id: app.id,
            job_id: app.job_id,
            status: app.status,
            created_at: app.created_at,
            job_title: job?.title || 'Unknown Job',
            job_category: job?.category || 'Unknown',
            job_region: job?.region || 'Unknown',
          };
        });
      }

      setApplications(appData);
    } catch (err) {
      console.error('Failed to fetch quotes/applications:', err);
    } finally {
      setLoading(false);
    }
  }, [contractorId, isDemo, demoLeads, demoQuotes]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleDisputeLead = (item: QuoteWithJob) => {
    setDisputeItem(item);
    setDisputeReason('');
  };

  const handleDisputeSubmit = async () => {
    if (!disputeItem || !disputeReason) return;
    setDisputing(true);
    setDisputeToast('');

    try {
      // === DEMO MODE ===
      if (isDemo) {
        setDisputeToast('Dispute submitted. Credits refunded.');
        setDisputeItem(null);
        setDisputeReason('');
        return;
      }

      // === LIVE MODE ===
      if (!contractorId) return;

      // Find the matching job application for this lead
      const { data: app } = await supabase
        .from('job_applications')
        .select('id, created_at')
        .eq('job_id', disputeItem.job_id)
        .eq('contractor_id', contractorId)
        .maybeSingle();

      const applicationId = app?.id || null;

      // Auto-refund if the quote was submitted less than 48 hours ago
      const createdAt = new Date(disputeItem.created_at).getTime();
      const isWithin48h = (Date.now() - createdAt) < 48 * 60 * 60 * 1000;

      const disputeStatus = isWithin48h ? 'approved' : 'pending';

      const { error: disputeError } = await supabase
        .from('lead_disputes')
        .insert({
          application_id: applicationId,
          contractor_id: contractorId,
          reason: disputeReason,
          status: disputeStatus,
          is_auto_refunded: isWithin48h,
        });

      if (disputeError) throw disputeError;

      if (isWithin48h) {
        const credits = getLeadCostCredits(disputeItem.budget_min, disputeItem.budget_max);

        const { data: wallet } = await supabase
          .from('contractor_wallet')
          .select('id, balance_credits')
          .eq('contractor_id', contractorId)
          .maybeSingle();

        if (wallet) {
          const newBalance = (wallet.balance_credits || 0) + credits;
          const { error: walletError } = await supabase
            .from('contractor_wallet')
            .update({ balance_credits: newBalance, updated_at: new Date().toISOString() })
            .eq('id', wallet.id);

          if (walletError) throw walletError;
        } else {
          const { error: walletError } = await supabase
            .from('contractor_wallet')
            .insert({ contractor_id: contractorId, balance_credits: credits });

          if (walletError) throw walletError;
        }

        setDisputeToast('Dispute approved. Credits refunded.');
      } else {
        setDisputeToast('Dispute submitted for admin review.');
      }

      setDisputeItem(null);
      setDisputeReason('');
    } catch (err) {
      console.error('Failed to submit dispute:', err);
      setDisputeToast('Failed to submit dispute. Please try again.');
    } finally {
      setDisputing(false);
      setTimeout(() => setDisputeToast(''), 4000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount == null) return '-';
    return `GYD ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">Requested</span>;
      case 'approved':
        return <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">Approved — Submit Quote</span>;
      case 'quote_submitted':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">Quote Submitted</span>;
      case 'submitted':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">Quote Submitted</span>;
      case 'accepted':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">Hired!</span>;
      case 'rejected':
        return <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-500 rounded-full font-label whitespace-nowrap">Not Selected</span>;
      default:
        return null;
    }
  };

  // Merge applications and quotes for display
  const allItems = [
    ...applications
      .filter((a) => !quotes.some((q) => q.job_id === a.job_id))
      .map((a) => ({ ...a, type: 'application' as const })),
    ...quotes.map((q) => ({ ...q, type: 'quote' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredItems = activeFilter === 'all'
    ? allItems
    : allItems.filter((item) => item.status === activeFilter);

  const counts = {
    all: allItems.length,
    requested: allItems.filter((i) => i.status === 'requested').length,
    approved: allItems.filter((i) => i.status === 'approved').length,
    quote_submitted: allItems.filter((i) => i.status === 'quote_submitted' || i.status === 'submitted').length,
    accepted: allItems.filter((i) => i.status === 'accepted').length,
    rejected: allItems.filter((i) => i.status === 'rejected').length,
  };

  const handleSubmitQuote = (item: any) => {
    if (isDemo) {
      navigate(`/submit-quote/${item.job_id}`);
    } else {
      navigate(`/submit-quote/${item.job_id}`);
    }
  };

  return (
    <div>
      {disputeToast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[100] bg-foreground-900 text-background-50 rounded-md px-5 py-3 shadow-sm max-w-md text-center top-20">
          <p className="text-sm font-label">{disputeToast}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-heading text-lg text-foreground-900">My Quotes</h3>
        {isDemo && (
          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
            DEMO
          </span>
        )}
      </div>
      <p className="text-sm text-foreground-600 mb-6">Track the quotes you have submitted for jobs.</p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allItems.length === 0 ? (
        <div className="text-center py-16 bg-background-50 border border-background-200/70 rounded-lg">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-file-list-3-line text-3xl text-foreground-400" />
          </div>
          <p className="text-foreground-600 text-sm font-label">No quotes submitted yet.</p>
          <p className="text-foreground-500 text-xs mt-1">
            Browse the Available Jobs tab and submit quotes to start connecting with project owners.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 mb-4 bg-background-100 rounded-lg p-1 w-fit flex-wrap">
            {(['all', 'requested', 'approved', 'quote_submitted', 'accepted', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === f
                    ? 'bg-white text-foreground-900 shadow-sm'
                    : 'text-foreground-500 hover:text-foreground-700'
                }`}
              >
                {f === 'all' ? 'All' : f === 'requested' ? 'Requested' : f === 'approved' ? 'Approved' : f === 'quote_submitted' ? 'Quote Submitted' : f === 'accepted' ? 'Hired' : 'Not Selected'}
                {counts[f] > 0 && (
                  <span className="ml-1 text-foreground-400">({counts[f]})</span>
                )}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-background-50 border border-background-200/70 rounded-lg">
              <p className="text-sm text-foreground-500">No quotes in this category.</p>
            </div>
          ) : (
            <div className="border border-background-200/70 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-background-50 border-b border-background-200/70">
                      <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Job Title</th>
                      <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs hidden sm:table-cell">Category</th>
                      <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs hidden sm:table-cell">Region</th>
                      <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Your Price</th>
                      <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs hidden sm:table-cell">Timeline</th>
                      <th className="text-center px-4 py-3 text-foreground-600 font-label font-medium text-xs">Status</th>
                      <th className="text-center px-4 py-3 text-foreground-600 font-label font-medium text-xs">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-50/50 transition-colors">
                        <td className="px-4 py-3 text-foreground-800 text-xs font-medium">
                          {item.job_title}
                          {isDemo && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-bold ml-1.5 whitespace-nowrap">DEMO</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">
                            {item.job_category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground-600 text-xs hidden sm:table-cell">{item.job_region || 'N/A'}</td>
                        <td className="px-4 py-3 text-xs font-medium text-foreground-800 font-label">{formatCurrency((item as any).proposed_price)}</td>
                        <td className="px-4 py-3 text-foreground-600 text-xs hidden sm:table-cell">{(item as any).estimated_timeline || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge((item as any).status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {(item as any).status === 'approved' && (
                              <button
                                onClick={() => handleSubmitQuote(item)}
                                className="text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-background-50 rounded-md font-label font-medium transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Submit Quote
                              </button>
                            )}
                            {item.type === 'quote' && (
                              <button
                                onClick={() => handleDisputeLead(item as QuoteWithJob)}
                                className="text-xs px-2.5 py-1.5 text-accent-600 hover:text-accent-700 font-label font-medium whitespace-nowrap cursor-pointer"
                              >
                                Dispute Lead
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {disputeItem && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground-900/40 backdrop-blur-sm"
            onClick={() => { if (!disputing) setDisputeItem(null); }}
          />
          <div className="relative bg-white border border-background-200/70 rounded-lg w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground-900">Dispute This Lead</h3>
                <p className="text-xs text-foreground-500 mt-0.5">{disputeItem.job_title}</p>
              </div>
              <button
                onClick={() => setDisputeItem(null)}
                disabled={disputing}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-foreground-600" />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-label font-semibold text-foreground-700 mb-1.5">Reason for dispute</label>
              <div className="relative">
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="font-label text-sm w-full px-3 py-2.5 rounded-md border border-background-300/60 bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer appearance-none pr-8"
                >
                  <option value="">Select a reason</option>
                  {DISPUTE_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-500 text-sm pointer-events-none" />
              </div>
            </div>

            <p className="text-xs text-foreground-500 mb-5 leading-relaxed">
              If this lead was unlocked less than 48 hours ago, your credits will be automatically refunded. Older disputes are reviewed by an admin.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setDisputeItem(null)}
                disabled={disputing}
                className="flex-1 py-2.5 px-4 text-sm font-label font-medium text-foreground-700 border border-background-200/70 rounded-md hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDisputeSubmit}
                disabled={!disputeReason || disputing}
                className="flex-1 py-2.5 px-4 text-sm font-label font-medium bg-accent-500 hover:bg-accent-600 disabled:bg-background-200 disabled:text-foreground-400 disabled:cursor-not-allowed text-background-50 rounded-md transition-colors cursor-pointer whitespace-nowrap order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                {disputing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Dispute'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}