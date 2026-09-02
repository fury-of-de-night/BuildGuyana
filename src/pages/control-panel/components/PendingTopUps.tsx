import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PendingTopUp {
  transaction_id: string;
  contractor_id: string;
  user_name: string;
  amount_credits: number;
  amount_gyd: number;
  mmg_transaction_id: string;
  screenshot_url: string | null;
  created_at: string;
}

export default function PendingTopUps() {
  const [topUps, setTopUps] = useState<PendingTopUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      if (!txData || txData.length === 0) {
        setTopUps([]);
        return;
      }

      const contractorIds = [...new Set((txData || []).map((t: any) => t.contractor_id))];
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractors')
        .select('id, profile_id')
        .in('id', contractorIds);

      if (contractorError) throw contractorError;

      const contractorMap = new Map((contractorData || []).map((c: any) => [c.id, c]));

      const profileIds = [...new Set((contractorData || []).map((c: any) => c.profile_id))];
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds);

      if (profileError) throw profileError;

      const profileMap = new Map((profileData || []).map((p: any) => [p.id, p]));

      const merged: PendingTopUp[] = (txData || []).map((tx: any) => {
        const contractor = contractorMap.get(tx.contractor_id);
        const profile = contractor ? profileMap.get(contractor.profile_id) : null;

        return {
          transaction_id: tx.id,
          contractor_id: tx.contractor_id,
          user_name: profile?.full_name || 'Unknown',
          amount_credits: tx.amount_credits,
          amount_gyd: tx.amount_gyd,
          mmg_transaction_id: tx.mmg_transaction_id,
          screenshot_url: tx.screenshot_url,
          created_at: tx.created_at,
        };
      });

      setTopUps(merged);
    } catch (err) {
      console.error('Failed to fetch pending top-ups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (topUp: PendingTopUp) => {
    setActionLoading(topUp.transaction_id);
    setFeedback(null);

    try {
      // 1. Mark transaction approved
      const { error: txUpdateError } = await supabase
        .from('wallet_transactions')
        .update({ status: 'approved' })
        .eq('id', topUp.transaction_id);

      if (txUpdateError) throw txUpdateError;

      // 2. Credit the contractor's wallet (create if missing)
      const { data: wallet, error: walletFetchError } = await supabase
        .from('contractor_wallet')
        .select('id, balance_credits')
        .eq('contractor_id', topUp.contractor_id)
        .maybeSingle();

      if (walletFetchError) throw walletFetchError;

      if (wallet) {
        const newBalance = (wallet.balance_credits || 0) + topUp.amount_credits;
        const { error: walletUpdateError } = await supabase
          .from('contractor_wallet')
          .update({ balance_credits: newBalance, updated_at: new Date().toISOString() })
          .eq('id', wallet.id);

        if (walletUpdateError) {
          await supabase
            .from('wallet_transactions')
            .update({ status: 'pending' })
            .eq('id', topUp.transaction_id);
          throw walletUpdateError;
        }
      } else {
        const { error: createWalletError } = await supabase
          .from('contractor_wallet')
          .insert({ contractor_id: topUp.contractor_id, balance_credits: topUp.amount_credits });

        if (createWalletError) {
          await supabase
            .from('wallet_transactions')
            .update({ status: 'pending' })
            .eq('id', topUp.transaction_id);
          throw createWalletError;
        }
      }

      setFeedback({ type: 'success', message: 'Wallet credited successfully.' });
      setTopUps((prev) => prev.filter((t) => t.transaction_id !== topUp.transaction_id));
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Approval failed: ${err?.message || 'Unknown error'}` });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (topUp: PendingTopUp) => {
    setActionLoading(topUp.transaction_id);
    setFeedback(null);

    try {
      const { error: txUpdateError } = await supabase
        .from('wallet_transactions')
        .update({ status: 'rejected' })
        .eq('id', topUp.transaction_id);

      if (txUpdateError) throw txUpdateError;

      setFeedback({ type: 'success', message: 'Top-up rejected.' });
      setTopUps((prev) => prev.filter((t) => t.transaction_id !== topUp.transaction_id));
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Rejection failed: ${err?.message || 'Unknown error'}` });
    } finally {
      setActionLoading(null);
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

  return (
    <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
      <div className="p-5 border-b border-background-200/70">
        <h2 className="font-heading text-lg text-foreground-900">Pending MMG Top-Ups</h2>
        <p className="text-sm text-foreground-600 mt-1">
          {topUps.length} pending top-up request{topUps.length !== 1 ? 's' : ''} awaiting verification
        </p>
      </div>

      {feedback && (
        <div className={`m-5 p-3 rounded-md border ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
        }`}>
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>{feedback.message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : topUps.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-check-double-line text-3xl text-foreground-400" />
          </div>
          <p className="text-foreground-600 text-sm font-label">No pending top-ups</p>
          <p className="text-foreground-500 text-xs mt-1">All MMG top-up requests have been processed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="bg-background-50 border-b border-background-200/70">
                <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Contractor</th>
                <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Amount</th>
                <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">MMG Transaction ID</th>
                <th className="text-center px-4 py-3 text-foreground-600 font-label font-medium text-xs">Screenshot</th>
                <th className="text-center px-4 py-3 text-foreground-600 font-label font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {topUps.map((tu) => (
                <tr key={tu.transaction_id} className="border-b border-background-200/70 last:border-0 hover:bg-background-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-foreground-800 text-xs font-medium">{tu.user_name}</p>
                    <p className="text-foreground-500 text-[10px]">{formatDate(tu.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-label font-medium text-green-600">+{tu.amount_credits} Credits</span>
                    <span className="block text-[10px] text-foreground-400 mt-0.5">GYD ${tu.amount_gyd.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap font-mono">
                      {tu.mmg_transaction_id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tu.screenshot_url ? (
                      <a
                        href={tu.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block cursor-pointer"
                      >
                        <img
                          src={tu.screenshot_url}
                          alt="MMG receipt screenshot"
                          className="w-14 h-14 object-cover rounded-md border border-background-200/70 hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ) : (
                      <span className="text-xs text-foreground-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleApprove(tu)}
                        disabled={actionLoading === tu.transaction_id}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                      >
                        {actionLoading === tu.transaction_id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(tu)}
                        disabled={actionLoading === tu.transaction_id}
                        className="px-3 py-1.5 bg-accent-100 hover:bg-accent-200/70 text-accent-800 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                      >
                        {actionLoading === tu.transaction_id ? '...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}