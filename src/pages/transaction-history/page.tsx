import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

interface Transaction {
  id: string;
  amount_credits: number;
  amount_gyd: number;
  transaction_type: string | null;
  mmg_transaction_id: string;
  status: string;
  created_at: string;
}

function getTransactionDisplay(type: string | null) {
  switch (type) {
    case 'top_up':
      return { label: 'Credit Top-Up', icon: 'ri-add-circle-line', amountClass: 'text-green-600' };
    case 'quote_submission':
      return { label: 'Quote Payment', icon: 'ri-file-list-3-line', amountClass: 'text-red-600' };
    case 'refund':
      return { label: 'Lead Refund', icon: 'ri-refund-2-line', amountClass: 'text-blue-600' };
    case 'admin_adjustment':
      return { label: 'Admin Adjustment', icon: 'ri-gift-line', amountClass: 'text-purple-600' };
    default:
      return { label: 'Transaction', icon: 'ri-exchange-line', amountClass: 'text-foreground-700' };
  }
}

function formatAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

function TransactionHistoryPage() {
  const { user, contractorProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    if (!contractorProfile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('contractor_id', contractorProfile.id)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setTransactions((data || []) as Transaction[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [contractorProfile]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status || '—';
    }
  };

  const totalCredits = transactions.reduce((sum, t) => sum + (t.amount_credits || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 px-4 md:px-6 pt-20 md:pt-24 pb-8 print:pt-0">
        <div className="max-w-4xl mx-auto">
          {/* Header (hidden on print) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 no-print">
            <div>
              <Link
                to="/dashboard/tradesperson"
                className="inline-flex items-center gap-1.5 text-sm text-foreground-500 hover:text-foreground-700 mb-2 cursor-pointer"
              >
                <i className="ri-arrow-left-line" />
                Back to Dashboard
              </Link>
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">Transaction History</h1>
              <p className="text-foreground-600 text-sm mt-1">
                A complete record of every wallet transaction on your account.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer no-print"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-printer-line" />
              </div>
              Print / Save as PDF
            </button>
          </div>

          {/* Print-only header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold text-foreground-900">BuildGuyana.gy — Transaction History</h1>
            <p className="text-sm text-foreground-600 mt-1">
              {user?.email || ''} · Generated {new Date().toLocaleDateString('en-GY', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 no-print">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16 no-print">
              <p className="text-sm text-accent-700 mb-4">{error}</p>
              <button
                onClick={fetchAll}
                className="px-4 py-2 text-sm font-label font-medium text-primary-600 border border-primary-200/60 rounded-md hover:bg-primary-50 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 bg-white border border-background-200/70 rounded-lg">
              <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                <i className="ri-exchange-line text-3xl text-foreground-400" />
              </div>
              <p className="text-foreground-600 text-sm">No transactions yet.</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-white border border-background-200/70 rounded-lg p-4 mb-6 flex items-center justify-between">
                <p className="text-sm text-foreground-600 font-label">
                  <strong className="text-foreground-900">{transactions.length}</strong> transaction{transactions.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-foreground-600 font-label">
                  Net credits: <strong className={totalCredits >= 0 ? 'text-green-600' : 'text-red-600'}>{formatAmount(totalCredits)}</strong>
                </p>
              </div>

              <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="bg-background-50 border-b border-background-200/70">
                        <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Date</th>
                        <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Type</th>
                        <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Amount</th>
                        <th className="text-center px-4 py-3 text-foreground-600 font-label font-medium text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const display = getTransactionDisplay(tx.transaction_type);
                        return (
                          <tr key={tx.id} className="border-b border-background-200/70 last:border-0">
                            <td className="px-4 py-3 text-foreground-600 text-xs">{formatDate(tx.created_at)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium font-label text-foreground-700">
                                <div className="w-3.5 h-3.5 flex items-center justify-center">
                                  <i className={display.icon} />
                                </div>
                                {display.label}
                              </span>
                              {tx.mmg_transaction_id && (
                                <span className="block text-[10px] text-foreground-400 mt-0.5">Ref: {tx.mmg_transaction_id}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium font-label ${display.amountClass}`}>{formatAmount(tx.amount_credits)} Credits</span>
                              <span className="block text-[10px] text-foreground-400 mt-0.5">GYD ${tx.amount_gyd.toLocaleString()}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-foreground-600">{getStatusBadge(tx.status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function TransactionHistoryRoute() {
  return (
    <AuthGuard requiredRole="tradesperson">
      <TransactionHistoryPage />
    </AuthGuard>
  );
}