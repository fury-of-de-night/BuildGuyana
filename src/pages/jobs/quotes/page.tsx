import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

interface QuoteWithContractor {
  id: string;
  contractor_id: string;
  contractor_name: string;
  contractor_trade: string;
  contractor_avatar: string | null;
  contractor_rating: number;
  contractor_reviews: number;
  contractor_years: number;
  contractor_phone: string | null;
  contractor_email: string | null;
  proposed_price: number;
  estimated_timeline: string;
  quote_document_url: string | null;
  status: string;
  created_at: string;
}

interface JobInfo {
  id: string;
  title: string;
  category: string;
  region: string;
  status: string;
  homeowner_id: string;
  homeowner_phone: string | null;
  homeowner_email: string | null;
}

export default function ReceivedQuotesPage() {
  return (
    <AuthGuard requiredRole="project_owner">
      <ReceivedQuotes />
    </AuthGuard>
  );
}

function ReceivedQuotes() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isDemo, demoJobs, demoQuotes, acceptDemoQuote } = useDemo();

  const [job, setJob] = useState<JobInfo | null>(null);
  const [quotes, setQuotes] = useState<QuoteWithContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [acceptModal, setAcceptModal] = useState<{ quoteId: string; contractorName: string; contractorId: string } | null>(null);
  const [accepting, setAccepting] = useState(false);

  const [acceptedQuote, setAcceptedQuote] = useState<QuoteWithContractor | null>(null);
  const [hiredContractor, setHiredContractor] = useState<{ phone: string; email: string } | null>(null);
  const [homeownerContact, setHomeownerContact] = useState<{ phone: string; email: string } | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);

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
          homeowner_phone: null,
          homeowner_email: null,
        });

        const jobQuotes = demoQuotes.filter((q) => q.job_id === jobId);
        const merged: QuoteWithContractor[] = jobQuotes.map((q) => ({
          id: q.id,
          contractor_id: q.contractor_id,
          contractor_name: q.contractor_name || 'Rajesh Singh',
          contractor_trade: 'House Construction',
          contractor_avatar: null,
          contractor_rating: 4.8,
          contractor_reviews: 42,
          contractor_years: 10,
          contractor_phone: null,
          contractor_email: null,
          proposed_price: q.proposed_price,
          estimated_timeline: q.estimated_timeline,
          quote_document_url: null,
          status: q.status,
          created_at: q.created_at,
        }));

        setQuotes(merged);
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

      const quotesResult = await supabase
        .from('quotes')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (quotesResult.error || !quotesResult.data || quotesResult.data.length === 0) {
        setQuotes([]);
        setLoading(false);
        return;
      }

      const accepted = quotesResult.data.find((q: any) => q.status === 'accepted');
      if (accepted) {
        setAcceptedQuote(accepted as any);
      }

      const contractorIds = quotesResult.data.map((q: any) => q.contractor_id);
      const contractorsResult = await supabase
        .from('contractors')
        .select('id, profile_id, category, years_experience, rating, review_count')
        .in('id', contractorIds);

      const contractorsMap = new Map<string, any>();
      (contractorsResult.data || []).forEach((c: any) => {
        contractorsMap.set(c.id, c);
      });

      const profileIds = (contractorsResult.data || []).map((c: any) => c.profile_id).filter(Boolean);
      const profilesResult = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone, region')
        .in('id', profileIds);

      const profilesMap = new Map<string, any>();
      (profilesResult.data || []).forEach((p: any) => {
        profilesMap.set(p.id, p);
      });

      const merged: QuoteWithContractor[] = quotesResult.data.map((q: any) => {
        const contractor = contractorsMap.get(q.contractor_id);
        const prof = contractor ? profilesMap.get(contractor.profile_id) : null;
        return {
          id: q.id,
          contractor_id: q.contractor_id,
          contractor_name: prof?.full_name || 'Tradesperson',
          contractor_trade: contractor?.category || 'General',
          contractor_avatar: prof?.avatar_url || null,
          contractor_rating: contractor?.rating ? parseFloat(contractor.rating) : 0,
          contractor_reviews: contractor?.review_count || 0,
          contractor_years: contractor?.years_experience || 0,
          contractor_phone: prof?.phone || null,
          contractor_email: null,
          proposed_price: q.proposed_price,
          estimated_timeline: q.estimated_timeline,
          quote_document_url: q.quote_document_url,
          status: q.status,
          created_at: q.created_at,
        };
      });

      setQuotes(merged);
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [jobId, user, isDemo, demoJobs, demoQuotes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcceptQuote = async () => {
    if (!acceptModal || !job) return;

    if (isDemo) {
      acceptDemoQuote(job.id, acceptModal.quoteId);
      setAcceptModal(null);
      setToast(`You have hired ${acceptModal.contractorName}! Check the popup for details.`);
      setTimeout(() => setToast(''), 5000);
      // Refresh data
      await fetchData();
      return;
    }

    setAccepting(true);

    try {
      const { error: quoteErr } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', acceptModal.quoteId);

      if (quoteErr) throw quoteErr;

      const { error: rejectErr } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('job_id', job.id)
        .neq('id', acceptModal.quoteId);

      if (rejectErr) console.error('Failed to reject other quotes:', rejectErr);

      const { error: jobErr } = await supabase
        .from('jobs')
        .update({ status: 'hired' })
        .eq('id', job.id);

      if (jobErr) throw jobErr;

      // Auto-generate a project agreement + 3 default milestones on hire.
      const acceptedQuoteData = quotes.find((q) => q.id === acceptModal.quoteId);
      const proposedPrice = acceptedQuoteData?.proposed_price || 0;

      const { data: agreement, error: agreementErr } = await supabase
        .from('project_agreements')
        .insert({
          job_id: job.id,
          homeowner_id: user!.id,
          contractor_id: acceptModal.contractorId,
          quote_id: acceptModal.quoteId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (agreementErr) {
        console.error('Failed to create project agreement:', agreementErr);
      } else if (agreement && proposedPrice > 0) {
        const phases = [
          { phase_name: 'Deposit / Mobilization', amount_gyd: Math.round(proposedPrice * 0.30) },
          { phase_name: 'Progress / Mid-point', amount_gyd: Math.round(proposedPrice * 0.40) },
          { phase_name: 'Final Completion', amount_gyd: Math.round(proposedPrice * 0.30) },
        ];
        const { error: msErr } = await supabase
          .from('milestones')
          .insert(
            phases.map((p) => ({
              agreement_id: agreement.id,
              phase_name: p.phase_name,
              amount_gyd: p.amount_gyd,
              status: 'pending',
            }))
          );
        if (msErr) {
          console.error('Failed to create milestones:', msErr);
        }
      }

      const contractorResult = await supabase
        .from('contractors')
        .select('profile_id')
        .eq('id', acceptModal.contractorId)
        .maybeSingle();

      let contractorContact: { phone: string; email: string } = { phone: '', email: '' };
      if (contractorResult?.data?.profile_id) {
        const profResult = await supabase
          .from('profiles')
          .select('phone, region')
          .eq('id', contractorResult.data.profile_id)
          .maybeSingle();

        if (profResult?.data) {
          contractorContact = { phone: profResult.data.phone || '', email: '' };
        }
      }

      const homeownerResult = await supabase
        .from('profiles')
        .select('phone, region')
        .eq('id', user!.id)
        .maybeSingle();

      const hoContact = {
        phone: homeownerResult?.data?.phone || profile?.phone || '',
        email: user?.email || '',
      };

      setHiredContractor(contractorContact);
      setHomeownerContact(hoContact);
      setRevealLoading(true);

      await supabase
        .from('notifications')
        .insert({
          user_id: contractorResult?.data?.profile_id || acceptModal.contractorId,
          title: 'You Have Been Hired!',
          message: `Congratulations! You have been hired for "${job.title}". Client contact: ${hoContact.phone}`,
          is_read: false,
          sender_name: 'BuildGuyana System',
        });

      const rejectedQuotes = quotes.filter((q) => q.id !== acceptModal.quoteId);
      for (const rq of rejectedQuotes) {
        const rcResult = await supabase
          .from('contractors')
          .select('profile_id')
          .eq('id', rq.contractor_id)
          .maybeSingle();

        if (rcResult?.data?.profile_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: rcResult.data.profile_id,
              title: 'Quote Not Selected',
              message: `Unfortunately, you were not selected for "${job.title}".`,
              is_read: false,
              sender_name: 'BuildGuyana System',
            });
        }
      }

      await fetchData();

      setTimeout(() => {
        setAcceptModal(null);
        setToast(`You have hired ${acceptModal.contractorName}! Contact info has been shared.`);
        setRevealLoading(false);
        setTimeout(() => setToast(''), 5000);
      }, 500);
    } catch (err) {
      console.error('Accept quote error:', err);
      setToast('Failed to accept quote. Please try again.');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setAccepting(false);
    }
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
      case 'submitted':
      case 'quote_submitted':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">Pending Review</span>;
      case 'accepted':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">Accepted</span>;
      case 'rejected':
        return <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-500 rounded-full font-label whitespace-nowrap">Not Selected</span>;
      default:
        return null;
    }
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
              {job.status === 'hired' && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">
                  Hired
                </span>
              )}
            </div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-1">{job.title}</h1>
            <p className="text-sm text-foreground-600">
              <strong className="text-foreground-900">{quotes.length}</strong> quote{quotes.length !== 1 ? 's' : ''} received
            </p>
          </div>

          {job.status === 'hired' && hiredContractor && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 md:p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-check-double-line text-green-600 text-lg" />
                </div>
                <h3 className="font-heading text-base font-bold text-green-800">Contractor Hired — Contact Info Shared</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-md p-3 border border-green-100">
                  <p className="text-xs text-foreground-500 font-label mb-1">Contractor Phone</p>
                  <p className="text-sm font-semibold text-foreground-900">{hiredContractor.phone || 'Not provided'}</p>
                </div>
                {homeownerContact && (
                  <div className="bg-white rounded-md p-3 border border-green-100">
                    <p className="text-xs text-foreground-500 font-label mb-1">Your Contact (Shared)</p>
                    <p className="text-sm font-semibold text-foreground-900">{homeownerContact.phone}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-green-700 mt-3">
                The contractor has been notified and received your contact information.
              </p>
            </div>
          )}

          {quotes.length === 0 ? (
            <div className="text-center py-16 bg-white border border-background-200/70 rounded-lg">
              <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                <i className="ri-file-list-3-line text-3xl text-foreground-400" />
              </div>
              <h3 className="font-heading text-lg text-foreground-900 mb-2">No Quotes Yet</h3>
              <p className="text-sm text-foreground-500 max-w-sm mx-auto">
                Tradespeople haven't submitted quotes for this job yet. Check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className={`bg-white border rounded-lg p-4 md:p-5 transition-colors ${
                    quote.status === 'accepted'
                      ? 'border-green-300/60 bg-green-50/30'
                      : quote.status === 'rejected'
                        ? 'border-background-200/70 opacity-70'
                        : 'border-background-200/70 hover:border-background-300/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-background-100 border border-background-200/70 flex-shrink-0">
                        {quote.contractor_avatar ? (
                          <img src={quote.contractor_avatar} alt={quote.contractor_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="ri-user-3-line text-foreground-400 text-lg" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading text-sm font-semibold text-foreground-900">
                            {quote.contractor_name}
                          </span>
                          {getStatusBadge(quote.status)}
                          {isDemo && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">DEMO</span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-500">{quote.contractor_trade} &middot; {quote.contractor_years} yrs experience</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex items-center gap-0.5">
                            <i className="ri-star-fill text-amber-500 text-xs" />
                            <span className="text-xs font-semibold text-foreground-800">{quote.contractor_rating.toFixed(1)}</span>
                          </div>
                          <span className="text-xs text-foreground-400">({quote.contractor_reviews})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="font-heading text-base font-bold text-foreground-900 whitespace-nowrap">
                        {formatCurrency(quote.proposed_price)}
                      </p>
                      <p className="text-xs text-foreground-600 flex items-center gap-1">
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-time-line" />
                        </div>
                        {quote.estimated_timeline}
                      </p>
                      <p className="text-xs text-foreground-400">{formatDate(quote.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {quote.quote_document_url && (
                        <a
                          href={quote.quote_document_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="px-3 py-1.5 text-xs font-label font-medium text-foreground-700 border border-background-200/70 rounded-md hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          View Quote
                        </a>
                      )}
                      {quote.status === 'submitted' && job.status !== 'hired' && (
                        <button
                          onClick={() => setAcceptModal({
                            quoteId: quote.id,
                            contractorName: quote.contractor_name,
                            contractorId: quote.contractor_id,
                          })}
                          className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Accept Quote
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {acceptModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground-900/40 backdrop-blur-sm" onClick={() => !accepting && setAcceptModal(null)} />
          <div className="relative bg-white border border-background-200/70 rounded-lg w-full max-w-md p-6 shadow-lg">
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-3">
                <i className="ri-user-star-line text-accent-600 text-xl" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground-900 mb-1">Confirm Hire</h3>
              <p className="text-sm text-foreground-600 leading-relaxed">
                You are hiring <strong className="text-foreground-900">{acceptModal.contractorName}</strong> for <strong className="text-foreground-900">"{job?.title}"</strong>. Their contact info will be shared with you, and your contact info will be shared with them.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setAcceptModal(null)}
                disabled={accepting}
                className="flex-1 py-2.5 px-4 text-sm font-label font-medium text-foreground-700 border border-background-200/70 rounded-md hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptQuote}
                disabled={accepting}
                className="flex-1 py-2.5 px-4 text-sm font-label font-medium bg-accent-500 hover:bg-accent-600 text-background-50 rounded-md transition-colors cursor-pointer whitespace-nowrap order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Yes, Hire Contractor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}