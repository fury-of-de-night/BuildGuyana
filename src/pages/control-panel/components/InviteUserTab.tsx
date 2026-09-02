import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { REGIONS } from '@/mocks/locations';

type Role = 'project_owner' | 'tradesperson';

export default function InviteUserTab() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('project_owner');
  const [region, setRegion] = useState('');
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: email.trim(), full_name: fullName.trim(), role, region: region.trim() },
      });

      if (error) {
        let message = 'Failed to send invitation.';
        try {
          const ctx = (error as any)?.context;
          if (ctx && typeof ctx === 'object') {
            const raw = ctx.text || ctx.json || '';
            const parsed = typeof raw === 'string' && raw ? JSON.parse(raw) : raw;
            if (parsed?.error) message = parsed.error;
          }
        } catch {
          // keep default message
        }
        setFeedback({ type: 'error', message });
        return;
      }

      if (!data?.success) {
        setFeedback({ type: 'error', message: data?.error || 'Failed to send invitation.' });
        return;
      }

      setFeedback({
        type: 'success',
        message: `Invitation sent to ${email.trim()}. They'll receive an email to set their password and complete registration.`,
      });
      setFullName('');
      setEmail('');
      setRegion('');
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to invite user.' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
      <div className="p-5 border-b border-background-200/70">
        <h2 className="font-heading text-lg text-foreground-900">Invite User</h2>
        <p className="text-sm text-foreground-600 mt-1">
          Invite a new user by email. Their profile is created automatically with the role and region you select.
        </p>
      </div>

      {feedback && (
        <div className={`m-5 p-3 rounded-md border ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
        }`}>
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
            {feedback.message}
          </p>
        </div>
      )}

      <form onSubmit={handleInvite} className="p-5 space-y-5">
        <div>
          <label htmlFor="invite-full-name" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Full Name <span className="text-accent-500">*</span>
          </label>
          <input
            id="invite-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Email Address <span className="text-accent-500">*</span>
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-700 mb-2 font-label">
            Role <span className="text-accent-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('project_owner')}
              className={`p-4 border-2 rounded-md text-center transition-colors cursor-pointer ${
                role === 'project_owner' ? 'border-primary-500 bg-primary-50' : 'border-background-200/70 hover:border-background-300'
              }`}
            >
              <div className="w-9 h-9 mx-auto mb-2 flex items-center justify-center">
                <i className="ri-home-4-line text-lg text-foreground-700" />
              </div>
              <span className="block text-sm font-medium text-foreground-800 whitespace-nowrap">Project Owner</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('tradesperson')}
              className={`p-4 border-2 rounded-md text-center transition-colors cursor-pointer ${
                role === 'tradesperson' ? 'border-primary-500 bg-primary-50' : 'border-background-200/70 hover:border-background-300'
              }`}
            >
              <div className="w-9 h-9 mx-auto mb-2 flex items-center justify-center">
                <i className="ri-tools-line text-lg text-foreground-700" />
              </div>
              <span className="block text-sm font-medium text-foreground-800 whitespace-nowrap">Tradesperson</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="invite-region" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Region
          </label>
          <select
            id="invite-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors cursor-pointer"
          >
            <option value="">Select region (defaults to Demerara-Mahaica)</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={inviting || !fullName.trim() || !email.trim()}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer inline-flex items-center gap-2"
          >
            {inviting ? (
              <>
                <div className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin" />
                Sending Invite...
              </>
            ) : (
              <>
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-mail-send-line" />
                </div>
                Send Invitation
              </>
            )}
          </button>
          <p className="text-xs text-foreground-400 mt-3">
            The invited user must check their email to set a password and complete registration.
          </p>
        </div>
      </form>
    </div>
  );
}