import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  DEMO_TRADESPERSON_PROFILE,
  DEMO_TRADESPERSON_CONTRACTOR,
  DEMO_PROJECT_OWNER_PROFILE,
  DEMO_WALLET_BALANCE,
  DEMO_JOBS,
  DEMO_LEADS,
  DEMO_TRANSACTIONS,
  DEMO_MILESTONES,
} from '@/mocks/demoData';
import type { Profile, ContractorProfile } from '@/contexts/AuthContext';
import type { DemoJob, DemoLead, DemoTransaction, DemoMilestone } from '@/mocks/demoData';

type DemoRole = 'tradesperson' | 'project_owner';

export interface DemoQuote {
  id: string;
  job_id: string;
  contractor_id: string;
  contractor_name: string;
  proposed_price: number;
  estimated_timeline: string;
  status: 'submitted' | 'accepted' | 'rejected';
  created_at: string;
}

export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function makePrefilledNotifications(): DemoNotification[] {
  return [
    {
      id: 'demo-notif-1',
      title: 'Welcome to BuildGuyana.gy Demo!',
      message: 'Explore the full platform experience. Try posting a job or submitting a quote to see how everything works.',
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-notif-2',
      title: 'New Plumbing job in Region 4',
      message: 'A new Leaky Faucet Repair job in Region 4 matches your trade. Head to Available Jobs to check it out.',
      is_read: false,
      created_at: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: 'demo-notif-3',
      title: 'Demo Credits Ready',
      message: 'You have 10 demo credits to use for submitting quotes. Each quote submission costs 1 credit.',
      is_read: false,
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
  ];
}

interface DemoContextValue {
  isDemo: boolean;
  demoRole: DemoRole;
  demoProfile: Profile;
  demoContractorProfile: ContractorProfile | null;
  demoWalletBalance: number;
  demoJobs: DemoJob[];
  demoLeads: DemoLead[];
  demoQuotes: DemoQuote[];
  demoTransactions: DemoTransaction[];
  demoUnlockedJobIds: Set<string>;
  demoNotifications: DemoNotification[];
  demoMilestones: DemoMilestone[];
  switchDemoRole: () => void;
  topUpDemoWallet: (amount: number) => void;
  unlockDemoLead: (job: DemoJob) => { success: boolean; waLink?: string; error?: string };
  requestDemoQuote: (job: DemoJob) => { success: boolean; error?: string };
  addDemoJob: (job: DemoJob) => void;
  approveDemoRequest: (jobId: string, contractorId: string) => void;
  submitDemoQuote: (quote: DemoQuote) => void;
  acceptDemoQuote: (jobId: string, quoteId: string) => void;
  submitDemoMilestoneProof: (milestoneId: string) => void;
  approveDemoMilestone: (milestoneId: string) => void;
  addDemoNotification: (title: string, message: string) => void;
  markDemoNotificationRead: (id: string) => void;
  markAllDemoNotificationsRead: () => void;
  startDemo: () => void;
  exitDemo: () => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);
const DEMO_STORAGE_KEY = 'buildguyana_demo_state_v1';

function loadSaved() {
  try {
    const saved = sessionStorage.getItem(DEMO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(() => {
    const saved = loadSaved();
    return saved ? saved.isDemo : false;
  });

  const [demoRole, setDemoRole] = useState<DemoRole>(() => {
    const saved = loadSaved();
    return saved ? saved.demoRole : 'tradesperson';
  });

  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = loadSaved();
    return saved ? saved.walletBalance : DEMO_WALLET_BALANCE;
  });

  const [transactions, setTransactions] = useState<DemoTransaction[]>(() => {
    const saved = loadSaved();
    return saved ? saved.transactions : [...DEMO_TRANSACTIONS];
  });

  const [unlockedJobIds, setUnlockedJobIds] = useState<Set<string>>(() => {
    const saved = loadSaved();
    return saved ? new Set(saved.unlockedJobIds) : new Set(DEMO_LEADS.map((l) => l.job_id));
  });

  const [leads, setLeads] = useState<DemoLead[]>(() => {
    const saved = loadSaved();
    return saved ? saved.leads : [...DEMO_LEADS];
  });

  const [demoJobs, setDemoJobs] = useState<DemoJob[]>(() => {
    const saved = loadSaved();
    return saved && saved.demoJobs ? saved.demoJobs : [...DEMO_JOBS];
  });

  const [demoQuotes, setDemoQuotes] = useState<DemoQuote[]>(() => {
    const saved = loadSaved();
    return saved && saved.demoQuotes ? saved.demoQuotes : [];
  });

  const [demoNotifications, setDemoNotifications] = useState<DemoNotification[]>(() => {
    const saved = loadSaved();
    if (saved && saved.demoNotifications && saved.demoNotifications.length > 0) {
      return saved.demoNotifications;
    }
    return isDemo ? makePrefilledNotifications() : [];
  });

  const [demoMilestones, setDemoMilestones] = useState<DemoMilestone[]>(() => {
    const saved = loadSaved();
    return saved && saved.demoMilestones ? saved.demoMilestones : [...DEMO_MILESTONES];
  });

  // Persist to sessionStorage whenever any demo state changes
  useEffect(() => {
    if (isDemo) {
      const stateToSave = {
        isDemo,
        demoRole,
        walletBalance,
        transactions,
        unlockedJobIds: Array.from(unlockedJobIds),
        leads,
        demoJobs,
        demoQuotes,
        demoNotifications,
        demoMilestones,
      };
      sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(stateToSave));
    } else {
      sessionStorage.removeItem(DEMO_STORAGE_KEY);
    }
  }, [isDemo, demoRole, walletBalance, transactions, unlockedJobIds, leads, demoJobs, demoQuotes, demoNotifications, demoMilestones]);

  const demoProfile = demoRole === 'tradesperson' ? DEMO_TRADESPERSON_PROFILE : DEMO_PROJECT_OWNER_PROFILE;
  const demoContractorProfile = demoRole === 'tradesperson' ? DEMO_TRADESPERSON_CONTRACTOR : null;

  const addDemoNotification = useCallback((title: string, message: string) => {
    const notif: DemoNotification = {
      id: `demo-notif-${Date.now()}`,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setDemoNotifications((prev) => [notif, ...prev]);
  }, []);

  const markDemoNotificationRead = useCallback((id: string) => {
    setDemoNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllDemoNotificationsRead = useCallback(() => {
    setDemoNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const startDemo = useCallback(() => {
    setIsDemo(true);
    setDemoRole('project_owner');
    setDemoNotifications(makePrefilledNotifications());
  }, []);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    setIsDemo(false);
    window.location.href = '/'; // Force full reload to clear all in-memory demo state
  }, []);

  const resetDemo = useCallback(() => {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    window.location.reload();
  }, []);

  const switchDemoRole = useCallback(() => {
    setDemoRole((prev) => (prev === 'tradesperson' ? 'project_owner' : 'tradesperson'));
  }, []);

  const topUpDemoWallet = useCallback((amount: number) => {
    setWalletBalance((prev) => prev + amount);
    setTransactions((prev) => [
      {
        id: `demo-tx-${Date.now()}`,
        type: 'top_up',
        amount,
        description: `Demo Top-Up — ${amount} Credits`,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const unlockDemoLead = useCallback(
    (job: DemoJob): { success: boolean; waLink?: string; error?: string } => {
      if (unlockedJobIds.has(job.id)) {
        return { success: false, error: 'You have already requested to quote on this job.' };
      }
      const newLead: DemoLead = {
        id: `demo-lead-${Date.now()}`,
        job_id: job.id,
        job_title: job.title,
        job_category: job.category,
        job_region: job.region,
        unlocked_at: new Date().toISOString(),
        cost_credits: 0,
        homeowner_phone: '5926123456',
        status: 'requested',
        contractor_id: DEMO_TRADESPERSON_CONTRACTOR.id,
      };
      setLeads((prev) => [newLead, ...prev]);
      setUnlockedJobIds((prev) => new Set(prev).add(job.id));
      addDemoNotification(
        'Quote Request Submitted',
        `Your request to quote on "${job.title}" has been submitted.`
      );
      return { success: true };
    },
    [unlockedJobIds, addDemoNotification]
  );

  const requestDemoQuote = useCallback(
    (job: DemoJob): { success: boolean; error?: string } => {
      if (unlockedJobIds.has(job.id)) {
        return { success: false, error: 'You have already requested to quote on this job.' };
      }
      const newLead: DemoLead = {
        id: `demo-lead-${Date.now()}`,
        job_id: job.id,
        job_title: job.title,
        job_category: job.category,
        job_region: job.region,
        unlocked_at: new Date().toISOString(),
        cost_credits: 0,
        homeowner_phone: '',
        status: 'requested',
        contractor_id: DEMO_TRADESPERSON_CONTRACTOR.id,
      };
      setLeads((prev) => [newLead, ...prev]);
      setUnlockedJobIds((prev) => new Set(prev).add(job.id));
      addDemoNotification(
        'Quote Request Submitted',
        `Your request to quote on "${job.title}" has been submitted.`
      );
      return { success: true };
    },
    [unlockedJobIds, addDemoNotification]
  );

  const addDemoJob = useCallback(
    (job: DemoJob) => {
      setDemoJobs((prev) => [job, ...prev]);
      addDemoNotification(
        'Job Posted Successfully',
        `Your job "${job.title}" has been posted. Tradespeople can now view and request to quote on it.`
      );
    },
    [addDemoNotification]
  );

  const approveDemoRequest = useCallback(
    (jobId: string, contractorId: string) => {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.job_id === jobId && lead.contractor_id === contractorId
            ? { ...lead, status: 'approved' as const }
            : lead
        )
      );
      const lead = leads.find((l) => l.job_id === jobId && l.contractor_id === contractorId);
      addDemoNotification(
        'Request Approved',
        `You approved the quote request for "${lead?.job_title || 'a job'}". The contractor can now submit their quote.`
      );
    },
    [leads, addDemoNotification]
  );

  const submitDemoQuote = useCallback(
    (quote: DemoQuote) => {
      setWalletBalance((prev) => Math.max(0, prev - 1));
      setTransactions((prev) => [
        {
          id: `demo-tx-${Date.now()}`,
          type: 'quote_submit',
          amount: 1,
          description: `Quote Submission — ${quote.proposed_price.toLocaleString()} GYD`,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setDemoQuotes((prev) => [quote, ...prev]);
      setLeads((prev) =>
        prev.map((lead) =>
          lead.job_id === quote.job_id && lead.contractor_id === quote.contractor_id
            ? { ...lead, status: 'quote_submitted' as const }
            : lead
        )
      );
      addDemoNotification(
        'Quote Submitted',
        `Your quote for "${quote.contractor_name}" has been submitted. 1 credit deducted.`
      );
      addDemoNotification(
        'New Quote Received',
        `A new quote of ${quote.proposed_price.toLocaleString()} GYD has been submitted for your job.`
      );
    },
    [addDemoNotification]
  );

  const acceptDemoQuote = useCallback(
    (jobId: string, quoteId: string) => {
      const acceptedQuote = demoQuotes.find((q) => q.id === quoteId);
      alert(
        "In the live version, this would reveal the contractor's phone number and send notifications!"
      );
      setDemoQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? { ...q, status: 'accepted' as const }
            : { ...q, status: 'rejected' as const }
        )
      );
      setDemoJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'hired' } : j))
      );
      if (acceptedQuote) {
        addDemoNotification(
          'Quote Accepted!',
          `Your quote for "${acceptedQuote.contractor_name}" has been accepted! In the live app, the homeowner's phone number would be revealed here.`
        );
      }
    },
    [demoQuotes, addDemoNotification]
  );

  const submitDemoMilestoneProof = useCallback(
    (milestoneId: string) => {
      const milestone = demoMilestones.find((m) => m.id === milestoneId);
      if (!milestone || milestone.status !== 'not_started') return;
      setDemoMilestones((prev) =>
        prev.map((ms) =>
          ms.id === milestoneId
            ? { ...ms, status: 'photo_submitted' as const, updated_at: new Date().toISOString() }
            : ms
        )
      );
      addDemoNotification(
        'Photo Proof Submitted',
        `You sent photo proof for milestone "${milestone.title}" via WhatsApp. The project owner will review and approve it.`
      );
    },
    [demoMilestones, addDemoNotification]
  );

  const approveDemoMilestone = useCallback(
    (milestoneId: string) => {
      const milestone = demoMilestones.find((m) => m.id === milestoneId);
      if (!milestone || milestone.status !== 'photo_submitted') return;
      setDemoMilestones((prev) =>
        prev.map((ms) =>
          ms.id === milestoneId
            ? { ...ms, status: 'approved' as const, payment_certificate: true, updated_at: new Date().toISOString() }
            : ms
        )
      );
      addDemoNotification(
        'Milestone Approved — Payment Certificate Issued',
        `You approved milestone "${milestone.title}". A Payment Certificate has been generated — pay your contractor directly for this verified stage.`
      );
    },
    [demoMilestones, addDemoNotification]
  );

  return (
    <DemoContext.Provider
      value={{
        isDemo,
        demoRole,
        demoProfile,
        demoContractorProfile,
        demoWalletBalance: walletBalance,
        demoJobs,
        demoLeads: leads,
        demoQuotes,
        demoTransactions: transactions,
        demoUnlockedJobIds: unlockedJobIds,
        demoNotifications,
        demoMilestones,
        startDemo,
        exitDemo,
        resetDemo,
        switchDemoRole,
        topUpDemoWallet,
        unlockDemoLead,
        requestDemoQuote,
        addDemoJob,
        approveDemoRequest,
        submitDemoQuote,
        acceptDemoQuote,
        submitDemoMilestoneProof,
        approveDemoMilestone,
        addDemoNotification,
        markDemoNotificationRead,
        markAllDemoNotificationsRead,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}