import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setReady(!!session);
    });
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setReady(!sessionError && !!data.session);
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setConfirmation('');
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your password. Please request a new reset link.');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 px-4 pt-28 pb-12">
        <div className="mx-auto max-w-md rounded-lg border border-background-200 bg-white p-8">
          <h1 className="font-heading text-2xl mb-5">Reset Your Password</h1>
          {loading ? <p role="status">Checking your reset link...</p> : complete ? (
            <p role="status">Your password has been updated. <Link to="/login" className="text-primary-600 underline">Continue to sign in</Link></p>
          ) : !ready ? (
            <p role="alert">This reset link is invalid or has expired. <Link to="/login" className="text-primary-600 underline">Request a new link from the login page.</Link></p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p role="alert" className="text-accent-900">{error}</p>}
              <label className="block text-sm">New Password
                <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-background-200 p-2" />
              </label>
              <label className="block text-sm">Confirm Password
                <input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-1 w-full rounded-md border border-background-200 p-2" />
              </label>
              <button disabled={saving} className="rounded-md bg-primary-500 px-4 py-2 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save New Password'}</button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
