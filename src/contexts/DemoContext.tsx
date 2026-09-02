import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  DEMO_TRADESPERSON_PROFILE,
  DEMO_TRADESPERSON_CONTRACTOR,
  DEMO_PROJECT_OWNER_PROFILE,
  DEMO_WALLET_BALANCE,
  DEMO_JOBS,
  DEMO_LEADS,
  DEMO_TRANSACTIONS,
} from '@/mocks/demoData';
import type { Profile, ContractorProfile } from '@/contexts/AuthContext';
import type { DemoJob, DemoLead, DemoTransaction } from '@/mocks/demoData';

type DemoRole = 'tradesperson' | 'project_owner';

interface DemoContextValue {
  isDemo: boolean;
  demoRole: DemoRole;
  demoProfile: Profile;
  demoContractorProfile: ContractorProfile | null;
  demoWalletBalance: number;
  demoJobs: DemoJob[];
  demoLeads: DemoLead[];
  demoTransactions: DemoTransaction[];
  demoUnlockedJobIds: Set<string>;
  switchDemoRole: () => void;
  topUpDemoWallet: (amount: number) => void;
  unlockDemoLead: (job: DemoJob) => { success: boolean; waLink?: string; error?: string };
  requestDemoQuote: (job: DemoJob) => { success: boolean; error?: string };
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children, initialRole = 'tradesperson' }: { children: ReactNode; initialRole?: DemoRole }) {
  const [demoRole, setDemoRole] = useState<DemoRole>(initialRole);
  const [walletBalance, setWalletBalance] = useState(DEMO_WALLET_BALANCE);
  const [transactions, setTransactions] = useState<DemoTransaction[]>([...DEMO_TRANSACTIONS]);
  const [unlockedJobIds, setUnlockedJobIds] = useState<Set<string>>(
    new Set(DEMO_LEADS.map((l) => l.job_id))
  );
  const [leads, setLeads] = useState<DemoLead[]>([...DEMO_LEADS]);

  const demoProfile = demoRole === 'tradesperson' ? DEMO_TRADESPERSON_PROFILE : DEMO_PROJECT_OWNER_PROFILE;
  const demoContractorProfile = demoRole === 'tradesperson' ? DEMO_TRADESPERSON_CONTRACTOR : null;

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
      };

      setLeads((prev) => [newLead, ...prev]);
      setUnlockedJobIds((prev) => new Set(prev).add(job.id));

      return { success: true };
    },
    [unlockedJobIds]
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
      };

      setLeads((prev) => [newLead, ...prev]);
      setUnlockedJobIds((prev) => new Set(prev).add(job.id));

      return { success: true };
    },
    [unlockedJobIds]
  );

  return (
    <DemoContext.Provider
      value={{
        isDemo: true,
        demoRole,
        demoProfile,
        demoContractorProfile,
        demoWalletBalance: walletBalance,
        demoJobs: DEMO_JOBS,
        demoLeads: leads,
        demoTransactions: transactions,
        demoUnlockedJobIds: unlockedJobIds,
        switchDemoRole,
        topUpDemoWallet,
        unlockDemoLead,
        requestDemoQuote,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return ctx;
}