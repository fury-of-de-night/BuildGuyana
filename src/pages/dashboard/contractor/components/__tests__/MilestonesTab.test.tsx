import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MilestonesTab } from '../MilestonesTab';
const state = vi.hoisted(() => ({ contractorProfile: { id: 'contractor-1', profile_id: 'person-1' }, confirmationError: null as { message: string } | null, rewardError: null as { message: string } | null, rewardUpdates: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ contractorProfile: state.contractorProfile, profile: null }) }));
vi.mock('@/contexts/DemoModeContext', () => ({ useDemo: () => ({ isDemo: false }) }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: (table: string) => {
  let updating = false;
  const query = {
    select: () => query, eq: () => query, in: () => query, order: () => query, maybeSingle: () => query,
    update: () => { updating = true; if (table === 'profiles') state.rewardUpdates(); return query; },
    then: (resolve: (result: unknown) => unknown, reject?: (error: unknown) => unknown) => {
      let data: unknown = [];
      let error: unknown = null;
      if (updating) error = table === 'milestones' ? state.confirmationError : state.rewardError;
      else if (table === 'project_agreements') data = [{ id: 'agreement-1', job_id: 'job-1', homeowner_id: 'owner-1' }];
      else if (table === 'milestones') data = [{ id: 'milestone-1', agreement_id: 'agreement-1', phase_name: 'Deposit', amount_gyd: 100, status: 'paid', created_at: '2026-01-01' }];
      else if (table === 'jobs') data = [{ id: 'job-1', title: 'Example job' }];
      else if (table === 'profiles') data = { reliable_payer_points: 0, trustworthy_pro_points: 0 };
      return Promise.resolve({ data, error }).then(resolve, reject);
    },
  };
  return query;
} } }));
beforeEach(() => { state.confirmationError = null; state.rewardError = null; state.rewardUpdates.mockClear(); });
async function confirm() {
  render(<MilestonesTab />);
  fireEvent.click(await screen.findByRole('button', { name: /Confirm Receipt/i }));
}
describe('receipt mutation feedback', () => {
  it('does not award points or report success after a returned database error', async () => {
    state.confirmationError = { message: 'Permission denied' };
    await confirm();
    expect(await screen.findByText(/Could not complete confirmation/)).toBeInTheDocument();
    expect(screen.queryByText('Receipt confirmed. Reward points awarded!')).not.toBeInTheDocument();
    expect(state.rewardUpdates).not.toHaveBeenCalled();
  });
  it('does not claim rewards succeeded when their update was denied', async () => {
    state.rewardError = { message: 'Permission denied' };
    await confirm();
    expect(await screen.findByText(/Could not complete confirmation/)).toBeInTheDocument();
    expect(screen.queryByText('Receipt confirmed. Reward points awarded!')).not.toBeInTheDocument();
  });
  it('reports success after the confirmation and reward updates succeed', async () => {
    await confirm();
    expect(await screen.findByText('Receipt confirmed. Reward points awarded!')).toBeInTheDocument();
    expect(state.rewardUpdates).toHaveBeenCalledTimes(2);
  });
});
