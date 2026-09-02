import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoModeContext';
import WhatsAppPopup from '@/components/feature/WhatsAppPopup';
import { CATEGORY_NAMES } from '@/mocks/categories';
import type { DemoMilestone } from '@/mocks/demoData';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext';

type TabKey = 'wallet' | 'jobs' | 'leads' | 'milestones';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'wallet', label: 'My Wallet', icon: 'ri-wallet-3-line' },
  { key: 'jobs', label: 'Available Jobs', icon: 'ri-briefcase-line' },
  { key: 'leads', label: 'My Leads', icon: 'ri-file-list-3-line' },
  { key: 'milestones', label: 'Project Guardian', icon: 'ri-shield-check-line' },
];

const REGIONS = [
  'Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5',
  'Region 6', 'Region 7', 'Region 8', 'Region 9', 'Region 10',
];

export default function DemoTradespersonPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const navigate = useNavigate();
  const {
    demoProfile, demoContractorProfile, demoWalletBalance,
    demoJobs, demoLeads, demoTransactions,
    demoMilestones, submitDemoMilestoneProof,
    switchDemoRole, topUpDemoWallet, unlockDemoLead,
  } = useDemo();
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || 'jobs');
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  const handleRequestToQuote = (jobId: string, jobTitle: string) => {
    const job = demoJobs.find((j) => j.id === jobId);
    if (!job) return;

    const result = unlockDemoLead(job);
    if (!result.success) {
      setRequestError(result.error || 'Unable to request quote.');
      setTimeout(() => setRequestError(''), 5000);
      return;
    }
    setRequestError('');
    setRequestSuccess(`Request submitted for "${jobTitle}"! Switch to Owner View to see the request appear.`);
    setTimeout(() => setRequestSuccess(''), 8000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 px-4 md:px-6 pt-[110px] md:pt-[126px] pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
                Welcome, {demoProfile.full_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">DEMO</span>
                <span className="text-foreground-600 text-sm">Tradesperson View</span>
                {demoContractorProfile && (
                  <span className="text-xs text-amber-500">
                    ★ {demoContractorProfile.rating.toFixed(1)} ({demoContractorProfile.review_count} reviews)
                  </span>
                )}
                <button
                  onClick={() => { switchDemoRole(); navigate('/demo-project-owner'); }}
                  className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-label hover:bg-amber-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Switch to Owner View
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-amber-300/60 rounded-lg px-4 py-2.5">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-coin-line text-amber-500" />
              </div>
              <span className="text-sm text-foreground-600 font-label">Credits:</span>
              <span className="text-lg font-semibold text-foreground-900 font-label">{demoWalletBalance}</span>
            </div>
          </div>

          {/* Profile Card */}
          {demoContractorProfile && (
            <div className="bg-white border border-background-200/70 rounded-lg p-5 mb-8">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <i className="ri-user-3-line text-2xl text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="font-heading text-lg text-foreground-900">{demoContractorProfile.category}</h2>
                    {demoContractorProfile.tier === 'elite' && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-vip-crown-line text-xs" />
                        </div>
                        Elite Tier
                      </span>
                    )}
                    {demoContractorProfile.verified && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label">Verified</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground-600">{demoContractorProfile.years_experience} years experience · {demoContractorProfile.region}</p>
                  <p className="text-xs text-foreground-500 mt-1">{demoContractorProfile.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {demoContractorProfile.categories.map((cat) => (
                      <span key={cat} className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label">{cat}</span>
                    ))}
                  </div>
                  {/* 3-Tier Verification Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-background-200/70">
                    {demoContractorProfile.id_verification_status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-id-card-line text-xs" />
                        </div>
                        Verified ID
                      </span>
                    )}
                    {demoContractorProfile.doc_business_reg && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-building-2-line text-xs" />
                        </div>
                        Business Registered
                      </span>
                    )}
                    {demoContractorProfile.trade_license_status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-award-line text-xs" />
                        </div>
                        Licensed Professional
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden mb-8">
            <div className="flex border-b border-background-200/70">
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
              {/* Success / Error messages */}
              {requestError && (
                <div className="mb-4 p-3 bg-accent-100/80 border border-accent-300/60 rounded-md">
                  <p className="text-accent-900 text-sm">{requestError}</p>
                </div>
              )}
              {requestSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      <i className="ri-check-line text-green-600" />
                    </div>
                    <div>
                      <p className="text-green-800 text-sm font-label font-medium">Request Submitted!</p>
                      <p className="text-green-700 text-sm mt-1">{requestSuccess}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'wallet' && (
                <WalletTab
                  balance={demoWalletBalance}
                  transactions={demoTransactions}
                  onTopUp={topUpDemoWallet}
                />
              )}
              {activeTab === 'jobs' && (
                <JobsTab
                  demoJobs={demoJobs}
                  demoLeads={demoLeads}
                  onRequestToQuote={handleRequestToQuote}
                />
              )}
              {activeTab === 'leads' && (
                <LeadsTab
                  demoLeads={demoLeads}
                  demoJobs={demoJobs}
                  onContactClick={(name) => { setWhatsAppTarget(name); setShowWhatsAppPopup(true); }}
                />
              )}
              {activeTab === 'milestones' && (
                <MilestonesTab
                  milestones={demoMilestones}
                  onSubmitProof={submitDemoMilestoneProof}
                  onContactClick={(name) => { setWhatsAppTarget(name); setShowWhatsAppPopup(true); }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <WhatsAppPopup
        isOpen={showWhatsAppPopup}
        onClose={() => setShowWhatsAppPopup(false)}
        targetName={whatsAppTarget}
      />
      <Footer />
    </div>
  );
}

function WalletTab({
  balance,
  transactions,
  onTopUp,
}: {
  balance: number;
  transactions: ReturnType<typeof useDemo>['demoTransactions'];
  onTopUp: (amount: number) => void;
}) {
  const { getCreditToGyd } = usePlatformSettings();
  const ratePerCredit = getCreditToGyd(1);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="col-span-2 bg-background-50 border border-background-200/70 rounded-lg p-6 flex flex-col justify-center">
          <p className="text-sm text-foreground-600 font-label mb-2">Demo Credit Balance</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <i className="ri-coin-line text-3xl text-amber-500" />
            </div>
            <p className="text-4xl font-bold text-foreground-900 font-label">{balance} Credits</p>
          </div>
          <p className="text-xs text-foreground-500 mt-2">
            Requesting to quote is free. Credits are only used when submitting detailed quotes.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-6 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <i className="ri-add-circle-line text-xl text-amber-600" />
          </div>
          <button
            onClick={() => onTopUp(10)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Add 10 Demo Credits
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-heading text-lg text-foreground-900 mb-4">Credit Rate</h3>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5 mb-6">
          <p className="text-sm text-foreground-700">
            <strong>1 Credit = GYD {ratePerCredit.toLocaleString()}</strong>
          </p>
          <p className="text-xs text-foreground-500 mt-1">
            In the live version, you purchase credits to submit detailed quotes. For this demo, use the button above to add credits.
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-heading text-lg text-foreground-900 mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-background-50 border border-background-200/70 rounded-lg">
            <p className="text-foreground-500 text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-background-50 border border-background-200/70 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground-900 font-label">{tx.description}</p>
                  <p className="text-xs text-foreground-500 mt-0.5">{formatDate(tx.created_at)}</p>
                </div>
                <span className={`text-sm font-semibold font-label ${tx.type === 'top_up' ? 'text-green-600' : 'text-foreground-700'}`}>
                  {tx.type === 'top_up' ? '+' : ''}{tx.amount} {tx.amount === 1 ? 'Credit' : 'Credits'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobsTab({
  demoJobs,
  demoLeads,
  onRequestToQuote,
}: {
  demoJobs: ReturnType<typeof useDemo>['demoJobs'];
  demoLeads: ReturnType<typeof useDemo>['demoLeads'];
  onRequestToQuote: (jobId: string, jobTitle: string) => void;
}) {
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredJobs = demoJobs.filter((job) => {
    if (filterRegion && job.region !== filterRegion) return false;
    if (filterCategory && job.category !== filterCategory) return false;
    return true;
  });

  const formatBudget = (min: number, max: number) => {
    if (!min && !max) return 'Not specified';
    return `GYD ${min.toLocaleString()} — ${max.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getJobRequestStatus = (jobId: string) => {
    const lead = demoLeads.find((l) => l.job_id === jobId);
    return lead ? 'requested' : null;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 cursor-pointer">
          <option value="">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 cursor-pointer">
          <option value="">All Categories</option>
          {CATEGORY_NAMES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button onClick={() => { setFilterRegion(''); setFilterCategory(''); }} className="w-full sm:w-auto px-4 py-2.5 text-sm border border-background-200/70 text-foreground-600 rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">
          Clear Filters
        </button>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-background-50 border border-background-200/70 rounded-lg">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-briefcase-line text-3xl text-foreground-400" />
          </div>
          <p className="text-foreground-600 text-sm font-label">No jobs found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const reqStatus = getJobRequestStatus(job.id);
            return (
              <div key={job.id} className="bg-background-50 border border-background-200/70 rounded-lg p-4 md:p-5 hover:border-amber-300/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">{job.category}</span>
                      <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">{job.region}</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">DEMO</span>
                    </div>
                    <h4 className="font-heading text-base text-foreground-900 mb-1">{job.title}</h4>
                    <p className="text-sm text-foreground-600 line-clamp-2 mb-2">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-500">
                      <span className="flex items-center gap-1"><div className="w-3 h-3 flex items-center justify-center"><i className="ri-map-pin-line" /></div>{job.location}</span>
                      <span className="font-medium text-foreground-700">{formatBudget(job.budget_min, job.budget_max)}</span>
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {reqStatus === 'requested' ? (
                      <span className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-md font-label font-medium whitespace-nowrap">
                        <i className="ri-check-line mr-1" />
                        Requested
                      </span>
                    ) : (
                      <button
                        onClick={() => onRequestToQuote(job.id, job.title)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-chat-smile-2-line" />
                        </div>
                        Request to Quote
                      </button>
                    )}
                    <span className="text-xs text-foreground-400">Free — no credits needed</span>
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

function LeadsTab({
  demoLeads,
  demoJobs,
  onContactClick,
}: {
  demoLeads: ReturnType<typeof useDemo>['demoLeads'];
  demoJobs: ReturnType<typeof useDemo>['demoJobs'];
  onContactClick: (name: string) => void;
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested': return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">Requested</span>;
      case 'approved': return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-label whitespace-nowrap">Approved</span>;
      case 'quote_submitted': return <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-label whitespace-nowrap">Quote Submitted</span>;
      case 'hired': return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">Hired!</span>;
      default: return <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div>
      <h3 className="font-heading text-lg text-foreground-900 mb-1">Your Quote Requests</h3>
      <p className="text-sm text-foreground-600 mb-6">Track your demo quote requests through the BuildGuyana.gy flow.</p>

      {demoLeads.length === 0 ? (
        <div className="text-center py-16 bg-background-50 border border-background-200/70 rounded-lg">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-file-list-3-line text-3xl text-foreground-400" />
          </div>
          <p className="text-foreground-600 text-sm font-label">No leads yet.</p>
          <p className="text-foreground-500 text-xs mt-1">Go to Available Jobs and request to quote on a demo job.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {demoLeads.map((lead) => {
            const job = demoJobs.find((j) => j.id === lead.job_id);
            return (
              <div key={lead.id} className="bg-background-50 border border-background-200/70 rounded-lg p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">{lead.job_category}</span>
                      <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">{lead.job_region}</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">DEMO</span>
                      {getStatusBadge(lead.status)}
                    </div>
                    <h4 className="font-heading text-base text-foreground-900 mb-1">{lead.job_title}</h4>
                    {job && (
                      <p className="text-sm text-foreground-600 line-clamp-2 mb-2">{job.description}</p>
                    )}
                    <p className="text-xs text-foreground-500">
                      {lead.status === 'requested' && 'Waiting for the project owner to review your profile.'}
                      {lead.status === 'approved' && 'You have been invited to submit a detailed quote!'}
                      {lead.status === 'quote_submitted' && 'Your quote is under review.'}
                      {lead.status === 'hired' && 'Congratulations! The owner accepted your quote.'}
                    </p>
                    <p className="text-xs text-foreground-400 mt-1">{formatDate(lead.unlocked_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {lead.status === 'hired' && lead.homeowner_phone && (
                      <button
                        onClick={() => onContactClick('Project Owner')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <div className="w-3 h-3 flex items-center justify-center">
                          <i className="ri-whatsapp-line" />
                        </div>
                        Contact Owner
                      </button>
                    )}
                    <span className="text-xs text-foreground-400">
                      {lead.cost_credits > 0 ? `${lead.cost_credits} Credit${lead.cost_credits > 1 ? 's' : ''}` : 'Free'}
                    </span>
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

function MilestonesTab({
  milestones,
  onSubmitProof,
  onContactClick,
}: {
  milestones: DemoMilestone[];
  onSubmitProof: (milestoneId: string) => void;
  onContactClick: (name: string) => void;
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (ms: DemoMilestone) => {
    switch (ms.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-label whitespace-nowrap">
            <div className="w-3 h-3 flex items-center justify-center">
              <i className="ri-check-double-line text-xs" />
            </div>
            Approved · Certificate Issued
          </span>
        );
      case 'photo_submitted':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label whitespace-nowrap">
            <div className="w-3 h-3 flex items-center justify-center">
              <i className="ri-camera-line text-xs" />
            </div>
            Photo Sent — Awaiting Approval
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-0.5 bg-background-100 text-foreground-500 rounded-full font-label whitespace-nowrap">
            Not Started
          </span>
        );
    }
  };

  return (
    <div>
      <div className="flex items-start gap-3 mb-5 p-4 bg-amber-50/70 border border-amber-300/60 rounded-lg">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <i className="ri-shield-check-line text-amber-500 text-lg" />
        </div>
        <div>
          <h3 className="font-heading text-sm text-foreground-900">Project Guardian is protecting this job</h3>
          <p className="text-xs text-foreground-600 mt-0.5">
            Send photo proof of each completed stage via WhatsApp. Once the owner approves, a Payment Certificate is
            generated so you get paid directly for verified work.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {milestones.map((ms, idx) => (
          <div key={ms.id} className="bg-background-50 border border-background-200/70 rounded-lg p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-label text-xs font-bold shrink-0 ${
                    ms.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-secondary-100 text-secondary-900'
                  }`}>
                    {idx + 1}
                  </span>
                  <h4 className="font-heading text-sm text-foreground-900">{ms.title}</h4>
                  {getStatusBadge(ms)}
                </div>
                <p className="text-xs text-foreground-600">{ms.description}</p>
                <p className="text-xs text-foreground-400 mt-1.5">Updated {formatDate(ms.updated_at)}</p>
              </div>
              {ms.status === 'not_started' && (
                <button
                  onClick={() => { onSubmitProof(ms.id); onContactClick(`Milestone: ${ms.title} — Photo Proof`); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  <div className="w-3 h-3 flex items-center justify-center">
                    <i className="ri-camera-line" />
                  </div>
                  Submit Photo Proof
                </button>
              )}
              {ms.status === 'approved' && ms.payment_certificate && (
                <p className="inline-flex items-center gap-1 text-xs text-green-700 font-label whitespace-nowrap">
                  <div className="w-3 h-3 flex items-center justify-center">
                    <i className="ri-bank-card-line text-xs" />
                  </div>
                  Payment Certificate issued
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}