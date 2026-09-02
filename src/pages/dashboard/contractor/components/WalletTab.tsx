import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface Transaction {
  id: string;
  amount_credits: number;
  amount_gyd: number;
  transaction_type: string | null;
  mmg_transaction_id: string;
  mmg_number_used: string;
  screenshot_url: string | null;
  status: string;
  created_at: string;
}

interface WalletTabProps {
  walletId: string | null;
  balance: number;
  contractorId: string;
  onBalanceChange: () => void;
}

const MMG_RECEIVING_NUMBER = '7322838';
const MMG_PAYOUT_NUMBER = '6735423';

const TOP_UP_PACKAGES = [
  { credits: 1, gyd: 500 },
  { credits: 5, gyd: 2500 },
  { credits: 10, gyd: 5000 },
  { credits: 20, gyd: 10000 },
];

export function WalletTab({ walletId, balance, contractorId, onBalanceChange }: WalletTabProps) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ credits: number; gyd: number } | null>(null);
  const [toppingUp, setToppingUp] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState('');

  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTransactions = useCallback(async () => {
    if (!contractorId) return;
    setLoadingTx(true);
    try {
      const limit = expanded ? 1000 : 8;
      const [dataResult, countResult] = await Promise.all([
        supabase
          .from('wallet_transactions')
          .select('*')
          .eq('contractor_id', contractorId)
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('wallet_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('contractor_id', contractorId),
      ]);

      if (dataResult.error) throw dataResult.error;
      setTransactions((dataResult.data || []) as Transaction[]);
      setTotalCount(countResult.count || 0);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  }, [contractorId, expanded]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setTopUpError('Please select an image file (JPEG, PNG, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setTopUpError('Image must be under 5MB.');
      return;
    }

    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setTopUpError('');
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTopUp = async () => {
    setTopUpError('');
    setTopUpSuccess('');

    if (!selectedPackage) {
      setTopUpError('Please select a credit package.');
      return;
    }
    if (!contractorId) {
      setTopUpError('Contractor profile not found. Please contact support.');
      return;
    }
    if (!transactionRef.trim()) {
      setTopUpError('Please enter your MMG Transaction ID.');
      return;
    }

    setToppingUp(true);

    try {
      let screenshotUrl: string | null = null;

      if (screenshotFile) {
        try {
          const uploadResult = await uploadToCloudinary(screenshotFile);
          screenshotUrl = uploadResult.secure_url;
        } catch (uploadErr) {
          console.error('Screenshot upload failed:', uploadErr);
          setTopUpError('Failed to upload screenshot. Please try again.');
          setToppingUp(false);
          return;
        }
      }

      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          contractor_id: contractorId,
          amount_credits: selectedPackage.credits,
          amount_gyd: selectedPackage.gyd,
          transaction_type: 'top_up',
          mmg_transaction_id: transactionRef.trim(),
          mmg_number_used: MMG_RECEIVING_NUMBER,
          screenshot_url: screenshotUrl,
          status: 'pending',
        });

      if (txError) throw txError;

      setTopUpSuccess('Top-up request submitted! An admin will verify and credit your wallet shortly.');
      setSelectedPackage(null);
      setTransactionRef('');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchTransactions();
    } catch (err) {
      setTopUpError('Failed to submit top-up request. Please try again.');
      console.error('Top-up error:', err);
    } finally {
      setToppingUp(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label bg-amber-100 text-amber-700 whitespace-nowrap">
            <div className="w-2 h-2 flex items-center justify-center"><i className="ri-time-line text-[10px]" /></div>
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label bg-green-100 text-green-700 whitespace-nowrap">
            <div className="w-2 h-2 flex items-center justify-center"><i className="ri-check-line text-[10px]" /></div>
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label bg-accent-100 text-accent-700 whitespace-nowrap">
            <div className="w-2 h-2 flex items-center justify-center"><i className="ri-close-line text-[10px]" /></div>
            Rejected
          </span>
        );
      default:
        return <span className="text-xs text-foreground-400">-</span>;
    }
  };

  const formatAmount = (amount: number): string => {
    return amount > 0 ? `+${amount}` : `${amount}`;
  };

  const getTransactionDisplay = (type: string | null) => {
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
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-background-50 border border-background-200/70 rounded-lg p-6 flex flex-col justify-center">
          <p className="text-sm text-foreground-600 font-label mb-2">Current Balance</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <i className="ri-coin-line text-3xl text-amber-500" />
            </div>
            <p className="text-4xl font-bold text-foreground-900 font-label">{balance} Credits</p>
          </div>
          <p className="text-xs text-foreground-500 mt-2">1 Credit = GYD $500. Top up via MMG to unlock job leads and contact project owners directly.</p>
        </div>
        <div className="bg-white border border-background-200/70 rounded-lg p-6 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <i className="ri-add-line text-xl text-primary-600" />
          </div>
          <button
            onClick={() => { setShowTopUp(true); setTopUpSuccess(''); setTopUpError(''); setTransactionRef(''); setSelectedPackage(null); setScreenshotFile(null); setScreenshotPreview(null); }}
            className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Top Up Credits
          </button>
          <p className="text-xs text-foreground-500 text-center">Pay with Mobile Money Guyana</p>
        </div>
      </div>

      {/* My Payout / Withdrawal Number */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center shrink-0">
            <i className="ri-bank-card-2-line text-secondary-700 text-base" />
          </div>
          <div>
            <p className="text-xs text-foreground-500 font-label">My Payout/Withdrawal Number</p>
            <p className="text-sm font-medium text-foreground-900 font-label tracking-wider">{MMG_PAYOUT_NUMBER}</p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 text-xs font-label text-foreground-500 hover:text-primary-500 transition-colors cursor-pointer whitespace-nowrap"
        >
          <div className="w-3.5 h-3.5 flex items-center justify-center">
            <i className="ri-pencil-line" />
          </div>
          Edit
        </button>
      </div>

      {/* MMG Top-Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-lg text-foreground-900 mb-2">Top Up Credits</h3>
            <p className="text-sm text-foreground-600 mb-4">
              Send the exact amount to our official BuildGuyana MMG number below, then enter the Transaction ID.
            </p>

            {topUpError && (
              <div className="mb-4 p-2.5 bg-accent-100/80 border border-accent-300/60 rounded-md">
                <p className="text-accent-900 text-xs">{topUpError}</p>
              </div>
            )}
            {topUpSuccess && (
              <div className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-xs">{topUpSuccess}</p>
              </div>
            )}

            {/* Receiving MMG Number */}
            <div className="p-4 bg-primary-50 border border-primary-200/70 rounded-lg text-center mb-4">
              <p className="text-xs text-foreground-500 font-label mb-1">Official BuildGuyana MMG Number</p>
              <p className="text-2xl font-bold text-foreground-900 font-label tracking-widest">{MMG_RECEIVING_NUMBER}</p>
            </div>

            {/* Credit Package Selection */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-foreground-500 font-label mb-1">Select Credit Package</p>
              {TOP_UP_PACKAGES.map((pkg) => (
                <button
                  key={pkg.credits}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full text-left px-4 py-3 rounded-md border transition-colors cursor-pointer ${
                    selectedPackage?.credits === pkg.credits
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-background-200/70 hover:border-background-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground-800 font-label">
                      {pkg.credits} Credit{pkg.credits !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-foreground-500">GYD ${pkg.gyd.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* MMG Transaction ID */}
            <div className="mb-4">
              <label htmlFor="mmg-txn-id" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                MMG Transaction ID <span className="text-accent-500">*</span>
              </label>
              <input
                id="mmg-txn-id"
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. MMG123456789"
                className="w-full px-3 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
              />
            </div>

            {/* Screenshot Upload (Optional) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Upload MMG Receipt Screenshot <span className="text-foreground-400 font-normal">(Optional)</span>
              </label>
              {screenshotPreview ? (
                <div className="relative">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full h-32 object-cover rounded-md border border-background-200/70"
                  />
                  <button
                    onClick={handleRemoveScreenshot}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-foreground-900/60 hover:bg-foreground-900/80 text-background-50 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                      <i className="ri-close-line text-xs" />
                    </div>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-background-300/60 rounded-md bg-background-50 hover:bg-background-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-image-add-line text-foreground-400 text-lg" />
                  </div>
                  <span className="text-xs text-foreground-500">Tap to upload screenshot</span>
                  <span className="text-[10px] text-foreground-400">JPEG or PNG, max 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleScreenshotSelect}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowTopUp(false); setTopUpError(''); setTopUpSuccess(''); setScreenshotFile(null); setScreenshotPreview(null); setTransactionRef(''); setSelectedPackage(null); }}
                className="flex-1 py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={toppingUp || !selectedPackage || !transactionRef.trim()}
                className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {toppingUp ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h3 className="font-heading text-lg text-foreground-900 mb-4">Transaction History</h3>
        {loadingTx ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-background-50 border border-background-200/70 rounded-lg">
            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <i className="ri-exchange-line text-2xl text-foreground-400" />
            </div>
            <p className="text-foreground-600 text-sm">No transactions yet.</p>
            <p className="text-foreground-500 text-xs mt-1">Top up your wallet to get started.</p>
          </div>
        ) : (
          <div className="border border-background-200/70 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="bg-background-50 border-b border-background-200/70">
                    <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Date</th>
                    <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Amount</th>
                    <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Type</th>
                    <th className="text-center px-4 py-3 text-foreground-600 font-label font-medium text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const display = getTransactionDisplay(tx.transaction_type);
                    return (
                      <tr key={tx.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-50/50 transition-colors">
                        <td className="px-4 py-3 text-foreground-600 text-xs">{formatDate(tx.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium font-label ${display.amountClass}`}>{formatAmount(tx.amount_credits)} Credits</span>
                          <span className="block text-[10px] text-foreground-400 mt-0.5">GYD ${tx.amount_gyd.toLocaleString()}</span>
                        </td>
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
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(tx.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loadingTx && transactions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
            {!expanded && totalCount > 8 && (
              <button
                onClick={() => setExpanded(true)}
                className="px-4 py-2 text-sm font-label font-medium text-foreground-700 border border-background-200/70 rounded-md hover:bg-background-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                See more
              </button>
            )}
            <button
              onClick={() => navigate('/transaction-history')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-label font-medium text-primary-600 border border-primary-200/60 rounded-md hover:bg-primary-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-arrow-right-line" />
              </div>
              See all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}