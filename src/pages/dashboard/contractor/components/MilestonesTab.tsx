import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { openMilestoneReceipt } from '@/lib/milestoneReceipt';

interface MilestoneItem {
  id: string;
  phase_name: string;
  amount_gyd: number;
  status: string | null;
  created_at: string;
  job_title: string;
  homeowner_id: string;
}

export function MilestonesTab() {
  const { contractorProfile, profile } = useAuth();
  const { isDemo } = useDemo();
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const fetchMilestones = useCallback(async () => {
    if (isDemo || !contractorProfile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: agreements, error: agErr } = await supabase
        .from('project_agreements')
        .select('id, job_id, homeowner_id')
        .eq('contractor_id', contractorProfile.id);

      if (agErr) throw agErr;
      if (!agreements || agreements.length === 0) {
        setMilestones([]);
        return;
      }

      const agreementIds = agreements.map((a) => a.id);
      const jobIds = [...new Set(agreements.map((a) => a.job_id).filter(Boolean))];

      const [milestoneRes, jobRes] = await Promise.all([
        supabase
          .from('milestones')
          .select('*')
          .in('agreement_id', agreementIds)
          .in('status', ['paid', 'confirmed'])
          .order('created_at', { ascending: false }),
        jobIds.length
          ? supabase.from('jobs').select('id, title').in('id', jobIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (milestoneRes.error) throw milestoneRes.error;

      const jobMap = new Map((jobRes.data || []).map((j: any) => [j.id, j.title]));
      const agreementMap = new Map(agreements.map((a) => [a.id, a]));

      const mapped: MilestoneItem[] = (milestoneRes.data || []).map((m: any) => {
        const ag = agreementMap.get(m.agreement_id);
        return {
          id: m.id,
          phase_name: m.phase_name,
          amount_gyd: Number(m.amount_gyd) || 0,
          status: m.status,
          created_at: m.created_at,
          job_title: jobMap.get(ag?.job_id) || 'Untitled Job',
          homeowner_id: ag?.homeowner_id || '',
        };
      });

      setMilestones(mapped);
    } catch (err: any) {
      setError(err?.message || 'Failed to load milestones.');
    } finally {
      setLoading(false);
    }
  }, [contractorProfile, isDemo]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const incrementPoints = async (
    profileId: string,
    column: 'reliable_payer_points' | 'trustworthy_pro_points',
  ) => {
    if (!profileId) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select(column)
        .eq('id', profileId)
        .maybeSingle();
      const current = Number(data?.[column]) || 0;
      await supabase
        .from('profiles')
        .update({ [column]: current + 1 })
        .eq('id', profileId);
    } catch (err) {
      console.error('Failed to increment reward points:', err);
    }
  };

  const handleConfirmReceipt = async (item: MilestoneItem) => {
    setConfirming(item.id);
    try {
      await supabase
        .from('milestones')
        .update({ status: 'confirmed', contractor_confirmed_paid_at: new Date().toISOString() })
        .eq('id', item.id);

      await incrementPoints(item.homeowner_id, 'reliable_payer_points');
      if (contractorProfile?.profile_id) {
        await incrementPoints(contractorProfile.profile_id, 'trustworthy_pro_points');
      }

      setToast('Receipt confirmed. Reward points awarded!');
      await fetchMilestones();
    } catch (err: any) {
      setToast('Failed to confirm receipt. Please try again.');
    } finally {
      setConfirming(null);
      setTimeout(() => setToast(''), 4000);
    }
  };

  const formatCurrency = (amount: number) => `GYD ${Number(amount || 0).toLocaleString()}`;
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GY', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-accent-700 mb-4">{error}</p>
        <button
          onClick={fetchMilestones}
          className="px-4 py-2 text-sm font-label font-medium text-primary-600 border border-primary-200/60 rounded-md hover:bg-primary-50 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isDemo) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-foreground-600">Milestones are not available in Demo mode.</p>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 top-20 z-[100] bg-foreground-900 text-background-50 rounded-md px-5 py-3 shadow-sm max-w-md text-center">
          <p className="text-sm font-label">{toast}</p>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-flag-2-line text-3xl text-foreground-400" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-2">No payments to confirm</h3>
          <p className="text-sm text-foreground-500 max-w-sm mx-auto">
            When a project owner marks a milestone as paid, it will appear here for you to confirm receipt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((item) => (
            <div
              key={item.id}
              className="border border-background-200/70 rounded-lg p-4 md:p-5 bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-heading text-base font-semibold text-foreground-900">{item.phase_name}</h4>
                    {item.status === 'paid' && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">
                        Awaiting confirmation
                      </span>
                    )}
                    {item.status === 'confirmed' && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">
                        Paid &amp; Confirmed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-500 font-label mb-1">{item.job_title}</p>
                  <p className="text-sm font-semibold text-foreground-900">{formatCurrency(item.amount_gyd)}</p>
                  <p className="text-xs text-foreground-400 mt-1">{formatDate(item.created_at)}</p>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                  {item.status === 'paid' ? (
                    <button
                      onClick={() => handleConfirmReceipt(item)}
                      disabled={confirming === item.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-background-200 disabled:text-foreground-400 disabled:cursor-not-allowed text-background-50 text-xs font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {confirming === item.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-background-50 border-t-transparent rounded-full animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <div className="w-3.5 h-3.5 flex items-center justify-center">
                            <i className="ri-check-double-line" />
                          </div>
                          Confirm Receipt
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        openMilestoneReceipt({
                          jobTitle: item.job_title,
                          milestoneName: item.phase_name,
                          amountGyd: item.amount_gyd,
                          date: item.created_at,
                          contractorName: profile?.full_name || 'Tradesperson',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-label font-medium text-primary-600 border border-primary-200/60 rounded-md hover:bg-primary-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <div className="w-3.5 h-3.5 flex items-center justify-center">
                        <i className="ri-receipt-line" />
                      </div>
                      View Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}