import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { supabase } from '@/lib/supabase';
import { getDisplayName } from '@/lib/userDisplay';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { WalletTab } from './components/WalletTab';
import { JobsTab } from './components/JobsTab';
import { LeadsTab } from './components/LeadsTab';
import { TierTab } from './components/TierTab';
import { ProfileTab } from './components/ProfileTab';
import { MilestonesTab } from './components/MilestonesTab';

type TabKey = 'wallet' | 'jobs' | 'quotes' | 'profile' | 'tier' | 'milestones';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'wallet', label: 'My Wallet', icon: 'ri-wallet-3-line' },
  { key: 'jobs', label: 'Available Jobs', icon: 'ri-briefcase-line' },
  { key: 'quotes', label: 'My Quotes', icon: 'ri-file-list-3-line' },
  { key: 'milestones', label: 'Milestones', icon: 'ri-flag-2-line' },
  { key: 'profile', label: 'My Profile', icon: 'ri-user-settings-line' },
  { key: 'tier', label: 'Subscription', icon: 'ri-vip-crown-line' },
];

export default function TradespersonDashboardPage() {
  return (
    <AuthGuard requiredRole="tradesperson">
      <TradespersonDashboard />
    </AuthGuard>
  );
}

function TradespersonDashboard() {
  const { user, profile, contractorProfile } = useAuth();
  const { isDemo, demoRole, demoProfile, demoContractorProfile, demoWalletBalance, switchDemoRole } = useDemo();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>(
    searchParams.get('tab') === 'jobs' ? 'jobs' : 'wallet'
  );
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletId, setWalletId] = useState<string | null>(null);

  const displayProfile = isDemo ? demoProfile : profile;
  const displayContractor = isDemo ? demoContractorProfile : contractorProfile;
  const displayBalance = isDemo ? demoWalletBalance : walletBalance;

  const fetchWallet = useCallback(async () => {
    if (isDemo || !contractorProfile) return;
    try {
      const walletResult = await supabase
        .from('contractor_wallet')
        .select('id, balance_credits')
        .eq('contractor_id', contractorProfile.id)
        .maybeSingle();
      if (walletResult.data) {
        setWalletBalance(walletResult.data.balance_credits);
        setWalletId(walletResult.data.id);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  }, [contractorProfile, isDemo]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
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
                    <p className="text-foreground-600 text-sm">Tradesperson Dashboard</p>
                    {isDemo && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">DEMO</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {displayContractor && displayContractor.verification_status === 'pending' && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">
                    <div className="w-3 h-3 flex items-center justify-center">
                      <i className="ri-time-line text-xs" />
                    </div>
                    Verification Pending
                  </span>
                )}
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
              <div className="flex items-center gap-3 bg-white border border-background-200/70 rounded-lg px-4 py-2.5">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-coin-line text-amber-500" />
                </div>
                <span className="text-sm text-foreground-600 font-label">Balance:</span>
                <span className="text-lg font-semibold text-foreground-900 font-label">
                  {displayBalance} Credits
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden mb-8">
            <div className="flex flex-wrap border-b border-background-200/70">
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
                </button>
              ))}
            </div>

            <div className="p-4 md:p-6">
              {activeTab === 'wallet' && (
                <WalletTab
                  walletId={walletId}
                  balance={displayBalance}
                  contractorId={displayContractor?.id || ''}
                  onBalanceChange={fetchWallet}
                />
              )}
              {activeTab === 'jobs' && (
                <JobsTab
                  contractorId={displayContractor?.id || ''}
                  contractorName={displayProfile?.full_name || ''}
                  walletBalance={displayBalance}
                  walletId={walletId}
                  onBalanceChange={fetchWallet}
                />
              )}
              {activeTab === 'quotes' && (
                <LeadsTab contractorId={displayContractor?.id || ''} />
              )}
              {activeTab === 'profile' && (
                <ProfileTab />
              )}
              {activeTab === 'tier' && (
                <TierTab />
              )}
              {activeTab === 'milestones' && (
                <MilestonesTab />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}