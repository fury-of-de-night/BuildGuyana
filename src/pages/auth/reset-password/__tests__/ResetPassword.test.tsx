import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPassword from '../page';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), updateUser: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {
  getSession: mocks.getSession, updateUser: mocks.updateUser,
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: mocks.unsubscribe } } }),
} } }));
vi.mock('@/components/feature/Navbar', () => ({ default: () => null }));
vi.mock('@/components/feature/Footer', () => ({ default: () => null }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'test-session' } }, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
});
async function show() {
  render(<MemoryRouter><ResetPassword /></MemoryRouter>);
  await waitFor(() => expect(screen.queryByText('Checking your reset link...')).not.toBeInTheDocument());
}
function fill(password = 'NewPassword123!', confirmation = password) {
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: confirmation } });
  fireEvent.click(screen.getByRole('button', { name: 'Save New Password' }));
}
describe('password reset completion', () => {
  it('rejects expired or missing sessions', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await show(); expect(screen.getByRole('alert')).toHaveTextContent('invalid or has expired');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it('rejects mismatched passwords', async () => {
    await show(); fill('NewPassword123!', 'OtherPassword123!');
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it('updates the password and confirms only after success', async () => {
    await show(); fill();
    expect(await screen.findByText(/Your password has been updated/)).toBeInTheDocument();
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'NewPassword123!' });
  });
  it('keeps the form available on server rejection', async () => {
    mocks.updateUser.mockResolvedValue({ error: new Error('Reset link expired') });
    await show(); fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('Reset link expired');
    expect(screen.queryByText(/Your password has been updated/)).not.toBeInTheDocument();
  });
});
