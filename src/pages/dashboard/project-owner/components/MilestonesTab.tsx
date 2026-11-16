import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { openMilestoneReceipt } from '@/lib/milestoneReceipt';

interface Milestone {
  id: string;
  phase_name: string;
  amount_gyd: number;
  status: string | null;
  created_at: string;
}

interface MilestoneGroup {
  agreementId: string;
  jobId: string;
  jobTitle: string;
  contractorName: string;
  contractorProfileId: string | null;
  contractorPaymentMethod: string | null;
  milestones: Milestone[];
}

export function MilestonesTab() {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const [groups, setGroups] = useState<MilestoneGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingPaid, setMarkingPaid] = useState(false);
  const [toast, setToast] = useState('');
  const [activeMilestone, setActiveMilestone] = useState<{ group: MilestoneGroup; milestone: Milestone } | null>(null);

  const fetchMilestones = useCallback(async () => {
    if (!user || isDemo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: agreements, error: agErr } = await supabase
        .from('project_agreements')
        .select('id, job_id, contractor_id')
        .eq('homeowner_id', user.id)
        .in('status', ['hired', 'accepted', 'in_progress', 'completed'])
        .order('created_at', { ascending: false });

      if (agErr) throw agErr;
      if (!agreements || agreements.length === 0) {
        setGroups([]);
        return;
      }

      const jobIds = [...new Set(agreements.map((a) => a.job_id).filter(Boolean))];
      const contractorIds = [...new Set(agreements.map((a) => a.contractor_id).filter(Boolean))];

      const [jobRes, contractorRes] = await Promise.all([
        jobIds.length
          ? supabase.from('jobs').select('id, title').in('id', jobIds)
          : Promise.resolve({ data: [] }),
        contractorIds.length
          ? supabase.from('contractors').select('id, profile_id, payment_method_details').in('id', contractorIds)
          : Promise.resolve({ data: [] }),
      ]);

      const jobMap = new Map((jobRes.data || []).map((j: any) => [j.id, j.title]));
      const contractorMap = new Map((contractorRes.data || []).map((c: any) => [c.id, c]));

      const profileIds = (contractorRes.data || []).map((c: any) => c.profile_id).filter(Boolean);
      const profileRes = profileIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', profileIds)
        : { data: [] };
      const nameMap = new Map((profileRes.data || []).map((p: any) => [p.id, p.full_name]));

      const built: MilestoneGroup[] = [];
      for (const ag of agreements) {
        const contractor = contractorMap.get(ag.contractor_id);
        const { data: milestones } = await supabase
          .from('milestones')
          .select('*')
          .eq('agreement_id', ag.id)
          .order('created_at', { ascending: true });

        built.push({
          agreementId: ag.id,
          jobId: ag.job_id,
          jobTitle: jobMap.get(ag.job_id) || 'Untitled Job',
          contractorName: nameMap.get(contractor?.profile_id) || 'Tradesperson',
          contractorProfileId: contractor?.profile_id || null,
          contractorPaymentMethod: contractor?.payment_method_details || null,
          milestones: (milestones || []) as Milestone[],
        });
      }

      setGroups(built);
    } catch (err: any) {
      setError(err?.message || 'Failed to load milestones.');
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleMarkPaid = async () => {
    if (!activeMilestone) return;
    setMarkingPaid(true);
    try {
      const { error: paymentError } = await supabase
        .from('milestones')
        .update({ status: 'paid', homeowner_approved_at: new Date().toISOString() })
        .eq('id', activeMilestone.milestone.id);
      if (paymentError) throw paymentError;

      if (activeMilestone.group.contractorProfileId) {
        const { error: notificationError } = await supabase.from('notifications').insert({
          user_id: activeMilestone.group.contractorProfileId,
          title: 'Milestone marked as paid',
          message: `A project owner approved and marked the "${activeMilestone.milestone.phase_name}" milestone as paid. Please confirm receipt from your Milestones tab.`,
          is_read: false,
        });
        if (notificationError) console.error('Payment recorded but notification failed:', notificationError);
      }

      setToast('Milestone marked as paid.');
      setActiveMilestone(null);
      await fetchMilestones();
    } catch (err: any) {
      setToast('Failed to mark milestone as paid. Please try again.');
    } finally {
      setMarkingPaid(false);
      setTimeout(() => setToast(''), 4000);
    }
  };

  const formatCurrency = (amount: number) => `GYD ${Number(amount || 0).toLocaleString()}`;

  const isPaidOrConfirmed = (status: string | null) => status === 'paid' || status === 'confirmed';

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

  const totalMilestones = groups.reduce((sum, g) => sum + g.milestones.length, 0);

  return (
    <div>
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 top-20 z-[100] bg-foreground-900 text-background-50 rounded-md px-5 py-3 shadow-sm max-w-md text-center">
          <p className="text-sm font-label">{toast}</p>
        </div>
      )}

      {totalMilestones === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-flag-2-line text-3xl text-foreground-400" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-2">No milestones yet</h3>
          <p className="text-sm text-foreground-500 max-w-sm mx-auto">
            Milestones for your hired jobs will appear here so you can approve and track payment at each stage of the work.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.agreementId} className="border border-background-200/70 rounded-lg p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground-900">{group.jobTitle}</h3>
                  <p className="text-xs text-foreground-500 font-label">
                    {group.contractorName}
                    {group.contractorPaymentMethod ? ` · Payment: ${group.contractorPaymentMethod}` : ''}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap self-start sm:self-center">
                  {group.milestones.length} milestone{group.milestones.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {group.milestones.map((ms) => (
                  <div
                    key={ms.id}
                    className="border border-background-200/70 rounded-lg p-4 bg-background-50/60"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-label text-sm font-semibold text-foreground-900">{ms.phase_name}</h4>
                          {ms.status === 'paid' && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">
                              Awaiting confirmation
                            </span>
                          )}
                          {ms.status === 'confirmed' && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">
                              Paid &amp; Confirmed
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground-900">
                          {formatCurrency(ms.amount_gyd)}
                        </p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                        {isPaidOrConfirmed(ms.status) ? (
                          <button
                            onClick={() =>
                              openMilestoneReceipt({
                                jobTitle: group.jobTitle,
                                milestoneName: ms.phase_name,
                                amountGyd: ms.amount_gyd,
                                date: ms.created_at,
                                contractorName: group.contractorName,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-label font-medium text-primary-600 border border-primary-200/60 rounded-md hover:bg-primary-50 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <div className="w-3.5 h-3.5 flex items-center justify-center">
                              <i className="ri-receipt-line" />
                            </div>
                            View Receipt
                          </button>
                        ) : (
                          <>
                            <p className="text-[11px] italic text-foreground-500 leading-snug max-w-xs text-left sm:text-right">
                              &ldquo;By approving this quotation / granting permission, you agree for your contact information to be shared with the relevant tradesperson.&rdquo;
                            </p>
                            <button
                              onClick={() => setActiveMilestone({ group, milestone: ms })}
                              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Approve Milestone
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMilestone && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground-900/40 backdrop-blur-sm" onClick={() => setActiveMilestone(null)} />
          <div className="relative bg-white border border-background-200/70 rounded-lg w-full max-w-md p-6 shadow-lg">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground-900">Approve &amp; Pay Milestone</h3>
                <p className="text-xs text-foreground-500 mt-0.5">
                  {activeMilestone.group.jobTitle} — {activeMilestone.milestone.phase_name}
                </p>
              </div>
              <button
                onClick={() => setActiveMilestone(null)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-foreground-600" />
              </button>
            </div>

            <div className="mb-5 p-4 bg-background-50 border border-background-200/70 rounded-lg">
              <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-1">Amount</p>
              <p className="font-heading text-xl font-bold text-foreground-900">
                {formatCurrency(activeMilestone.milestone.amount_gyd)}
              </p>
            </div>

            <div className="mb-5">
              <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-1.5">
                Contractor Payment Method
              </p>
              <div className="p-3 bg-background-50 border border-background-200/70 rounded-md">
                <p className="text-sm font-medium text-foreground-900">
                  {activeMilestone.group.contractorPaymentMethod || 'No payment method provided yet.'}
                </p>
                <p className="text-xs text-foreground-500 mt-1">
                  {activeMilestone.group.contractorName}
                </p>
              </div>
            </div>

            <p className="text-[11px] italic text-foreground-500 mb-5">
              &ldquo;By approving this quotation / granting permission, you agree for your contact information to be shared with the relevant tradesperson.&rdquo;
            </p>

            <button
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-background-200 disabled:text-foreground-400 disabled:cursor-not-allowed text-background-50 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
            >
              {markingPaid ? (
                <>
                  <div className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Mark as Paid'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}