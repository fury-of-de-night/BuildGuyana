import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from '../AuthGuard';

const state = vi.hoisted(() => ({ user: null as { email: string } | null, profile: null as { is_tradesperson: boolean } | null, loading: false, isAdmin: false, isDemo: false }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => state }));
vi.mock('@/contexts/DemoModeContext', () => ({ useDemo: () => state }));
function show(role: 'admin' | 'tradesperson' = 'admin') {
  render(<MemoryRouter initialEntries={['/private']}><Routes>
    <Route path="/private" element={<AuthGuard requiredRole={role}><p>Protected content</p></AuthGuard>} />
    <Route path="/" element={<p>Public home</p>} />
    <Route path="/login" element={<p>Sign in</p>} />
    <Route path="/register" element={<p>Complete registration</p>} />
  </Routes></MemoryRouter>);
}
beforeEach(() => Object.assign(state, { user: null, profile: null, loading: false, isAdmin: false, isDemo: false }));
describe('protected access', () => {
  it('requires a session for administration', () => { show(); expect(screen.getByText('Sign in')).toBeInTheDocument(); });
  it('rejects a signed-in non-admin', () => {
    state.user = { email: 'member@example.test' }; show();
    expect(screen.getByText('Public home')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
  it('allows an administrator', () => {
    state.user = { email: 'admin@example.test' }; state.isAdmin = true; show();
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
  it('does not let demo mode bypass admin checks', () => { state.isDemo = true; show(); expect(screen.getByText('Sign in')).toBeInTheDocument(); });
  it('waits for authentication before exposing content', () => { state.loading = true; show(); expect(screen.getByText('Loading your account...')).toBeInTheDocument(); });
  it('requires a loaded tradesperson capability', () => {
    state.user = { email: 'member@example.test' }; show('tradesperson');
    expect(screen.getByText('Complete registration')).toBeInTheDocument();
  });
});
