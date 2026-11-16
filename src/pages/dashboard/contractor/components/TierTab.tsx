import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const TIER_ORDER = ['elite', 'pro', 'basic', 'free', 'trial'];

const TIER_DISPLAY: Record<string, { label: string; color: string; bg: string; border: string }> = {
  elite: { label: 'Elite', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  pro: { label: 'Pro', color: 'text-secondary-600', bg: 'bg-secondary-50', border: 'border-secondary-200' },
  basic: { label: 'Basic', color: 'text-foreground-600', bg: 'bg-background-100', border: 'border-background-200' },
  free: { label: 'Free', color: 'text-foreground-600', bg: 'bg-background-50', border: 'border-background-200' },
  trial: { label: 'Trial', color: 'text-accent-600', bg: 'bg-accent-50', border: 'border-accent-200' },
};

interface TierPricing {
  tier: string;
  label: string;
  priceGyd: number;
  priceLabel: string;
  features: string[];
  highlight: boolean;
  creditNote: boolean;
}

const TIER_PRICING: TierPricing[] = [
  {
    tier: 'trial',
    label: 'Trial',
    priceGyd: 0,
    priceLabel: 'Free',
    features: [
      'Temporary access for 1 month OR 3 shortlist opportunities',
      'Basic profile visibility',
      'Limited to 3 lead unlocks',
      'Whichever comes first — time or shortlists',
    ],
    highlight: false,
    creditNote: true,
  },
  {
    tier: 'free',
    label: 'Free',
    priceGyd: 0,
    priceLabel: 'Free',
    features: [
      'Permanent limited profile',
      'Basic platform access',
      'Standard listing in search results',
      'No expiration — stay visible forever',
    ],
    highlight: false,
    creditNote: true,
  },
  {
    tier: 'basic',
    label: 'Basic',
    priceGyd: 5000,
    priceLabel: 'GYD $5,000 /mo',
    features: [
      'Standard paid directory presence',
      'Stronger profile features & visibility',
      'Up to 15 leads unlocked per month',
      'Higher search ranking than Free tier',
    ],
    highlight: false,
    creditNote: false,
  },
  {
    tier: 'pro',
    label: 'Pro',
    priceGyd: 10000,
    priceLabel: 'GYD $10,000 /mo',
    features: [
      'Improved visibility across all regions',
      'Expanded profile with portfolio showcase',
      'Up to 50 leads unlocked per month',
      'Business tools and priority support',
    ],
    highlight: true,
    creditNote: false,
  },
  {
    tier: 'elite',
    label: 'Elite',
    priceGyd: 20000,
    priceLabel: 'GYD $20,000 /mo',
    features: [
      'Highest promotional visibility on the platform',
      'Premium placement at top of search results',
      'Unlimited lead unlocks per month',
      'Exclusive featured badge and priority ranking',
    ],
    highlight: false,
    creditNote: false,
  },
];

export function TierTab() {
  const { contractorProfile, refreshProfile } = useAuth();
  const [shortlistCount, setShortlistCount] = useState<number>(0);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState('');

  useEffect(() => {
    if (!contractorProfile) return;

    Promise.resolve(supabase
      .from('shortlists')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractorProfile.id))
      .then(({ count, error }) => {
        if (!error && count !== null) {
          setShortlistCount(count);
        }
      })
      .catch(() => {});

    // Calculate trial days remaining using trial_started_at from DB
    if (contractorProfile.trial_started_at) {
      const trialStart = new Date(contractorProfile.trial_started_at);
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 30);
      const diffMs = trialEnd.getTime() - Date.now();
      setDaysRemaining(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
    } else if (contractorProfile.tier_expires_at) {
      const expiryDate = new Date(contractorProfile.tier_expires_at);
      const diffMs = expiryDate.getTime() - Date.now();
      setDaysRemaining(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
    } else if (contractorProfile.tier === 'trial' && contractorProfile.created_at) {
      // Fallback for trial users without trial_started_at
      const trialEnd = new Date(contractorProfile.created_at);
      trialEnd.setDate(trialEnd.getDate() + 30);
      const diffMs = trialEnd.getTime() - Date.now();
      setDaysRemaining(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
    } else {
      setDaysRemaining(null);
    }
  }, [contractorProfile]);

  const handleCancelSubscription = async () => {
    if (!contractorProfile) return;
    setCancelling(true);
    setCancelFeedback('');
    try {
      const { error } = await supabase
        .from('contractors')
        .update({ tier: 'free', tier_expires_at: new Date().toISOString() })
        .eq('id', contractorProfile.id);

      if (error) throw error;

      await refreshProfile();
      setCancelFeedback('Subscription cancelled. You have been moved to the Free tier.');
      setTimeout(() => setCancelFeedback(''), 4000);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      setCancelFeedback('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (!contractorProfile) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
          <i className="ri-vip-crown-line text-3xl text-foreground-400" />
        </div>
        <p className="text-foreground-600 text-sm">No contractor profile found.</p>
      </div>
    );
  }

  const tier = contractorProfile.tier || 'trial';
  const totalLeads = contractorProfile.total_leads_unlocked || 0;
  const trialShortlistsUsed = contractorProfile.trial_shortlists_used ?? 0;
  const tierDisplay = TIER_DISPLAY[tier] || TIER_DISPLAY.trial;
  const tierIndex = TIER_ORDER.indexOf(tier);

  const isTrial = tier === 'trial';

  // Trial status using DB fields
  const trialShortlistsRemaining = Math.max(0, 3 - trialShortlistsUsed);
  const trialExpiredByTime = daysRemaining !== null && daysRemaining <= 0;
  const trialExpiredByShortlists = trialShortlistsUsed >= 3;
  const trialExpired = isTrial && (trialExpiredByTime || trialExpiredByShortlists);

  return (
    <div className="space-y-6">
      {cancelFeedback && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm">{cancelFeedback}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-background-200/70 rounded-lg p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-accent-100 flex items-center justify-center">
            <i className="ri-bookmark-line text-lg text-accent-600" />
          </div>
          <p className="font-heading text-2xl font-bold text-foreground-900">{shortlistCount}</p>
          <p className="text-xs text-foreground-500 font-label mt-0.5">{shortlistCount === 1 ? 'Person Shortlisted You' : 'People Shortlisted You'}</p>
        </div>

        <div className="bg-white border border-background-200/70 rounded-lg p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary-100 flex items-center justify-center">
            <i className="ri-calendar-line text-lg text-primary-600" />
          </div>
          <p className="font-heading text-2xl font-bold text-foreground-900">{daysRemaining !== null ? daysRemaining : '—'}</p>
          <p className="text-xs text-foreground-500 font-label mt-0.5">
            {isTrial && daysRemaining !== null
              ? `${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left in Trial`
              : daysRemaining !== null ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining` : 'Days remaining on tier'}
          </p>
        </div>

        <div className="bg-white border border-background-200/70 rounded-lg p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary-100 flex items-center justify-center">
            <i className="ri-whatsapp-line text-lg text-secondary-600" />
          </div>
          <p className="font-heading text-2xl font-bold text-foreground-900">{totalLeads}</p>
          <p className="text-xs text-foreground-500 font-label mt-0.5">Leads Unlocked</p>
        </div>
      </div>

      {/* Trial Status Card */}
      {isTrial && (
        <div className={`border rounded-lg p-6 ${trialExpired ? 'border-accent-300/60 bg-accent-50' : 'border-accent-200 bg-accent-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-1">Trial Status</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                  {trialExpired ? (
                    <i className="ri-alert-line text-lg text-accent-600" />
                  ) : (
                    <i className="ri-timer-line text-lg text-accent-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-accent-700">
                    {trialExpired ? 'Trial Expired' : 'Trial Active'}
                  </h3>
                  {!trialExpired && daysRemaining !== null && (
                    <p className="text-sm text-accent-600 font-medium">
                      {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''} Remaining
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Shortlist Usage Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-foreground-600 font-label">Trial Shortlists Used</span>
                <span className="text-xs font-semibold text-foreground-900">
                  {trialShortlistsUsed} / 3
                </span>
              </div>
              <div className="w-full bg-background-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${trialShortlistsUsed >= 3 ? 'bg-accent-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.min((trialShortlistsUsed / 3) * 100, 100)}%` }}
                />
              </div>
              {!trialExpiredByShortlists && (
                <p className="text-xs text-foreground-500 mt-1">
                  {trialShortlistsRemaining} shortlist{trialShortlistsRemaining !== 1 ? 's' : ''} remaining in your trial
                </p>
              )}
            </div>

            {/* Days Remaining Progress */}
            {daysRemaining !== null && contractorProfile.trial_started_at && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-foreground-600 font-label">Trial Days Elapsed</span>
                  <span className="text-xs font-semibold text-foreground-900">
                    {Math.min(30 - daysRemaining, 30)} / 30
                  </span>
                </div>
                <div className="w-full bg-background-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${trialExpiredByTime ? 'bg-accent-500' : 'bg-primary-500'}`}
                    style={{ width: `${Math.min(((30 - daysRemaining) / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Trial Expired Message */}
            {trialExpired && (
              <div className="p-4 bg-white/80 rounded-lg border border-accent-200/70">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-alert-line text-accent-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-accent-700 mb-1">Your trial has ended</p>
                    <p className="text-xs text-foreground-600">
                      {trialExpiredByShortlists
                        ? "You've used all 3 trial shortlists. Upgrade to continue unlocking leads."
                        : 'Your 30-day trial period has expired.'}
                    </p>
                    <p className="text-xs font-semibold text-foreground-900 mt-2">
                      Upgrade your tier to continue unlocking leads and get higher recommendation ranking!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trial Active Info */}
            {!trialExpired && (
              <div className="p-3 bg-white/80 rounded-lg border border-accent-200/70">
                <p className="text-xs text-foreground-700 leading-relaxed">
                  <strong>Your trial ends when:</strong> you use 3 shortlists OR 30 days pass — whichever comes first.
                  Lead credits must still be purchased separately at GYD $500 per credit.
                </p>
              </div>
            )}
          </div>

          {/* Credit Note for Trial */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200/60 rounded-md">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-error-warning-line text-amber-600" />
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Lead credits are still required for shortlists.</strong> Trial users must purchase credits (1 Credit = GYD $500) to unlock leads. Upgrading to Basic or higher gives you more visibility, but credits are always used for each lead unlocked.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Tier Card (for non-trial) */}
      {!isTrial && (
        <div className={`border rounded-lg p-6 ${tierDisplay.border} ${tierDisplay.bg}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-foreground-500 font-label uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tierDisplay.bg} border ${tierDisplay.border}`}>
                  <i className={`ri-vip-crown-line text-lg ${tierDisplay.color}`} />
                </div>
                <div>
                  <h3 className={`font-heading text-xl font-bold ${tierDisplay.color}`}>{tierDisplay.label}</h3>
                  <p className="text-xs text-foreground-500">{totalLeads} leads unlocked</p>
                </div>
              </div>
            </div>
          </div>

          {tier !== 'free' && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="text-xs font-label font-medium text-accent-600 hover:text-accent-700 border border-accent-200/60 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          )}

          {/* Credit Note for Free */}
          {tier === 'free' && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200/60 rounded-md">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="ri-error-warning-line text-amber-600" />
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Lead credits are still required for shortlists.</strong> Free users must purchase credits (1 Credit = GYD $500) to unlock leads. Upgrading to Basic or higher gives you more visibility, but credits are always used for each lead unlocked.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="bg-white border border-background-200/70 rounded-lg p-6">
        <h3 className="font-heading text-lg text-foreground-900 mb-2">Subscription Plans</h3>
        <p className="text-sm text-foreground-600 mb-6">
          Higher tiers get better visibility in search results and can unlock more leads per month. Choose the plan that fits your business.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIER_PRICING.map((plan) => {
            const isCurrent = plan.tier === tier;
            const isHigher = TIER_ORDER.indexOf(plan.tier) < tierIndex;
            const d = TIER_DISPLAY[plan.tier];

            return (
              <div
                key={plan.tier}
                className={`relative border rounded-lg p-5 flex flex-col transition-colors ${
                  plan.highlight
                    ? 'border-primary-500 bg-primary-50/30'
                    : isCurrent
                      ? `${d.border} ${d.bg}`
                      : 'border-background-200/70 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-background-50 text-[10px] font-label font-bold rounded-full whitespace-nowrap uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${d.bg} border ${d.border}`}>
                      <i className={`ri-vip-crown-line ${d.color} text-sm`} />
                    </div>
                    <h4 className={`font-heading text-base font-bold ${d.color}`}>{plan.label}</h4>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-foreground-900 font-label">
                      {plan.priceGyd === 0 ? 'Free' : `GYD $${plan.priceGyd.toLocaleString()}`}
                    </span>
                    {plan.priceGyd > 0 && (
                      <span className="text-xs text-foreground-500 font-label ml-1">/mo</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-foreground-700 leading-relaxed">
                      <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                        <i className={`ri-check-line ${isCurrent ? 'text-green-600' : 'text-foreground-400'} text-xs`} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.creditNote && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200/60 rounded-md">
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      <strong>Credits required:</strong> Lead credits (1 Credit = GYD $500) must still be purchased for each shortlist.
                    </p>
                  </div>
                )}

                <div>
                  {isCurrent ? (
                    <span className="block w-full py-2.5 text-center text-sm font-label font-medium bg-green-50 text-green-700 border border-green-200 rounded-md whitespace-nowrap">
                      Current Plan
                    </span>
                  ) : isHigher ? (
                    <span className="block w-full py-2.5 text-center text-sm font-label font-medium bg-background-100 text-foreground-500 border border-background-200/70 rounded-md whitespace-nowrap">
                      Previous Tier
                    </span>
                  ) : (
                    <span className="block w-full py-2.5 text-center text-sm font-label font-medium bg-background-100 text-foreground-500 border border-background-200/70 rounded-md whitespace-nowrap">
                      {plan.priceGyd === 0 ? 'Available' : 'Upgrade Coming Soon'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade prompt for trial/free users */}
      {(tier === 'trial' || tier === 'free') && (
        <div className="bg-primary-50 border border-primary-200/70 rounded-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-100 flex items-center justify-center">
            <i className="ri-rocket-line text-xl text-primary-600" />
          </div>
          <h3 className="font-heading text-base text-foreground-900 mb-2">Ready to Grow Your Business?</h3>
          <p className="text-sm text-foreground-600 mb-4 max-w-md mx-auto">
            Upgrade to Basic, Pro, or Elite to get more lead unlocks per month, higher search ranking, and priority placement on BuildGuyana.gy.
          </p>
          <p className="text-xs text-foreground-500">
            Tier upgrades will be available soon. In the meantime, keep building your profile and collecting reviews!
          </p>
        </div>
      )}

    </div>
  );
}