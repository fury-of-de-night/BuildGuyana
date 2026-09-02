import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logAdminAccess } from '@/services/adminLog';
import { tradespeople } from '@/mocks/tradespeople';
import VerificationQueue from './components/VerificationQueue';
import PendingTopUps from './components/PendingTopUps';
import InviteUserTab from './components/InviteUserTab';

const DEFAULT_PIN = '9922';

interface PendingContractor {
  id: string;
  profile_id: string;
  category: string;
  other_trade_description: string | null;
  region: string;
  years_experience: number | null;
  verification_status: string;
  verification_doc_url: string | null;
  full_name: string;
  phone: string | null;
  created_at: string;
}

interface PlatformSetting {
  key: string;
  value: string;
}

type TabKey = 'verification' | 'verification_api' | 'settings' | 'credits' | 'notifications' | 'data' | 'pending_topups' | 'invite_user';

export default function ControlPanelPage() {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('verification');
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [sessionCheckDone, setSessionCheckDone] = useState(false);
  const [storedPin, setStoredPin] = useState<string>(DEFAULT_PIN);
  const [pinLoading, setPinLoading] = useState(true);
  const [changePinModal, setChangePinModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeFeedback, setPinChangeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pinChangeLoading, setPinChangeLoading] = useState(false);

  // Email whitelist — after PIN, check admin email
  const [emailWhitelisted, setEmailWhitelisted] = useState<boolean | null>(null);
  const [emailCheckDone, setEmailCheckDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const hasActiveSession = !!data.session;
      setHasSession(hasActiveSession);
      setSessionCheckDone(true);
      if (hasActiveSession) {
        fetchStoredPin();
      } else {
        setPinLoading(false);
      }
    }).catch(() => {
      setHasSession(false);
      setSessionCheckDone(true);
      setPinLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Email whitelist check — runs after session is confirmed
  useEffect(() => {
    if (hasSession && !emailCheckDone) {
      supabase.auth.getUser().then(({ data }) => {
        const email = data.user?.email;
        setEmailWhitelisted(email === 'fury65shots@gmail.com');
        setEmailCheckDone(true);
      }).catch(() => {
        setEmailWhitelisted(false);
        setEmailCheckDone(true);
      });
    }
  }, [hasSession, emailCheckDone]);

  // Log admin access (IP tracking) once the panel is fully unlocked
  const accessLoggedRef = useRef(false);
  useEffect(() => {
    if (accessLoggedRef.current) return;
    if (authenticated && hasSession && emailWhitelisted) {
      accessLoggedRef.current = true;
      supabase.auth.getUser().then(({ data }) => {
        const uid = data.user?.id;
        if (uid) logAdminAccess(uid);
      }).catch(() => {});
    }
  }, [authenticated, hasSession, emailWhitelisted]);

  const fetchStoredPin = async () => {
    setPinLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'control_panel_pin')
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        setStoredPin(data.value);
      }
    } catch (err) {
      console.warn('Could not fetch stored PIN, using default:', err);
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === storedPin) {
      setAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Access denied.');
      setPin('');
    }
  };

  const handleLock = () => {
    setAuthenticated(false);
    setSessionCheckDone(false);
    setHasSession(null);
    setEmailWhitelisted(null);
    setEmailCheckDone(false);
    setPin('');
  };

  const handleOpenChangePin = () => {
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setPinChangeFeedback(null);
    setChangePinModal(true);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeFeedback(null);

    if (oldPin !== storedPin) {
      setPinChangeFeedback({ type: 'error', message: 'Current PIN is incorrect.' });
      return;
    }

    if (newPin.length < 4) {
      setPinChangeFeedback({ type: 'error', message: 'New PIN must be at least 4 characters.' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinChangeFeedback({ type: 'error', message: 'New PIN and confirmation do not match.' });
      return;
    }

    setPinChangeLoading(true);

    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert(
          { key: 'control_panel_pin', value: newPin, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) throw error;

      setStoredPin(newPin);
      setPinChangeFeedback({ type: 'success', message: 'PIN changed successfully.' });

      // TODO: When Resend is connected, send "PIN changed" email to Fury65shots@gmail.com
      // Example:
      // supabase.functions.invoke('send-pin-change-email', {
      //   body: { recipient: 'Fury65shots@gmail.com', subject: 'Control Panel PIN Changed' }
      // }).catch(console.error);

      setTimeout(() => {
        setChangePinModal(false);
        setPinChangeFeedback(null);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
      }, 1500);
    } catch (err) {
      setPinChangeFeedback({ type: 'error', message: 'Failed to save new PIN. Please try again.' });
    } finally {
      setPinChangeLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="bg-white border border-background-200/70 rounded-lg p-8 w-full max-w-sm mx-4">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-foreground-100 flex items-center justify-center">
              <i className="ri-lock-line text-xl text-foreground-700" />
            </div>
            <h1 className="font-heading text-lg text-foreground-900">Control Panel Access</h1>
            <p className="text-sm text-foreground-500 mt-1">Enter the PIN to continue</p>
          </div>
          <form onSubmit={handlePinSubmit}>
            {pinError && (
              <div className="mb-4 p-3 bg-accent-100/80 border border-accent-300/60 rounded-md">
                <p className="text-accent-900 text-xs">{pinError}</p>
              </div>
            )}
            {pinLoading && (
              <div className="flex justify-center mb-4">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
              disabled={pinLoading}
              className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 text-center tracking-widest placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pin.length === 0 || pinLoading}
              className="w-full mt-4 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="bg-white border border-background-200/70 rounded-lg p-8 w-full max-w-md mx-4 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent-100 flex items-center justify-center">
            <i className="ri-shield-user-line text-2xl text-accent-700" />
          </div>
          <h1 className="font-heading text-lg text-foreground-900 mb-2">Authentication Required</h1>
          <p className="text-sm text-foreground-600 mb-6">
            The control panel requires an active admin session to communicate with the database.
            Please log in first, then return to this page.
          </p>
          <Link
            to="/login?redirect=/bg-ops-7742"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-login-box-line" />
            </div>
            Go to Login
          </Link>
          <button
            onClick={handleLock}
            className="block w-full mt-3 text-xs text-foreground-500 hover:text-foreground-700 cursor-pointer"
          >
            Lock Panel & Exit
          </button>
        </div>
      </div>
    );
  }

  // Email whitelist gate — checking
  if (hasSession === true && !emailCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground-500">Verifying administrator access...</p>
        </div>
      </div>
    );
  }

  // Email whitelist gate — denied
  if (hasSession === true && emailCheckDone && !emailWhitelisted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="bg-white border border-background-200/70 rounded-lg p-8 w-full max-w-md mx-4 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent-100 flex items-center justify-center">
            <i className="ri-forbid-line text-2xl text-accent-700" />
          </div>
          <h1 className="font-heading text-lg text-foreground-900 mb-2">Access Denied</h1>
          <p className="text-sm text-foreground-600 mb-6">
            This panel is restricted to authorized administrators only.
          </p>
          <button
            onClick={handleLock}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-lock-line" />
            </div>
            Lock Panel & Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50">
      <header className="bg-white border-b border-background-200/70 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg md:text-xl text-foreground-900">BuildGuyana.gy Control Panel</h1>
            <p className="text-xs text-foreground-500 mt-0.5">Administrative Operations</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-3 py-1.5 text-xs font-label text-foreground-600 border border-background-200/70 rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
            >
              <div className="w-3.5 h-3.5 flex items-center justify-center">
                <i className="ri-home-4-line" />
              </div>
              Back to Site
            </Link>
            <button
              onClick={handleOpenChangePin}
              className="px-3 py-1.5 text-xs font-label text-foreground-600 border border-background-200/70 rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className="ri-key-2-line" />
                </div>
                Change PIN
              </span>
            </button>
            <button
              onClick={handleLock}
              className="px-3 py-1.5 text-xs font-label text-foreground-600 border border-background-200/70 rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {changePinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-background-200/70 rounded-lg p-6 w-full max-w-sm mx-4">
            <h2 className="font-heading text-base text-foreground-900 mb-4">Change Control Panel PIN</h2>
            <form onSubmit={handleChangePin}>
              {pinChangeFeedback && (
                <div className={`mb-4 p-3 rounded-md border ${
                  pinChangeFeedback.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-accent-100/80 border-accent-300/60'
                }`}>
                  <p className={`text-xs ${pinChangeFeedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
                    {pinChangeFeedback.message}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label htmlFor="old-pin" className="block text-xs text-foreground-600 mb-1 font-label">
                    Current PIN
                  </label>
                  <input
                    id="old-pin"
                    type="password"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    placeholder="Enter current PIN"
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 tracking-widest placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="new-pin" className="block text-xs text-foreground-600 mb-1 font-label">
                    New PIN
                  </label>
                  <input
                    id="new-pin"
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new PIN (min 4 chars)"
                    className="w-full px-3 py-2 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 tracking-widest placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-pin" className="block text-xs text-foreground-600 mb-1 font-label">
                    Confirm New PIN
                  </label>
                  <input
                    id="confirm-pin"
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Re-enter new PIN"
                    className="w-full px-3 py-2 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 tracking-widest placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setChangePinModal(false)}
                  disabled={pinChangeLoading}
                  className="px-4 py-2 text-xs font-label text-foreground-600 border border-background-200/70 rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinChangeLoading || !oldPin || !newPin || !confirmPin}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {pinChangeLoading ? 'Saving...' : 'Change PIN'}
                </button>
              </div>
            </form>
            <p className="text-[10px] text-foreground-400 mt-4 text-center">
              A notification email will be sent to Fury65shots@gmail.com when Resend is connected.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-wrap border-b border-background-200/70 mb-6 bg-white rounded-t-lg">
          {([
            { key: 'verification' as TabKey, label: 'Contractor Verification', icon: 'ri-shield-check-line' },
            { key: 'verification_api' as TabKey, label: 'Verification Queue (API)', icon: 'ri-shield-flash-line' },
            { key: 'settings' as TabKey, label: 'Platform Settings', icon: 'ri-settings-3-line' },
            { key: 'credits' as TabKey, label: 'Credit Management', icon: 'ri-coin-line' },
            { key: 'notifications' as TabKey, label: 'Send Notifications', icon: 'ri-megaphone-line' },
            { key: 'data' as TabKey, label: 'Data Management', icon: 'ri-database-2-line' },
            { key: 'pending_topups' as TabKey, label: 'Pending Top-Ups', icon: 'ri-bank-card-line' },
            { key: 'invite_user' as TabKey, label: 'Invite User', icon: 'ri-user-add-line' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-5 text-sm font-label font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                activeTab === tab.key
                  ? 'text-primary-600 border-primary-500'
                  : 'text-foreground-600 border-transparent hover:text-foreground-800 hover:bg-background-50'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={tab.icon} />
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'verification' && <VerificationTab />}
        {activeTab === 'verification_api' && <VerificationQueue />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'credits' && <CreditManagementTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'data' && <DataManagementTab />}
        {activeTab === 'pending_topups' && <PendingTopUps />}
        {activeTab === 'invite_user' && <InviteUserTab />}
      </div>
    </div>
  );
}

function formatError(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes('row-level security')) {
    return 'Permission denied. Your account does not have access to change this setting.';
  }
  if (msg.includes('violates') && msg.includes('constraint')) {
    return 'Invalid data format. Please check your inputs and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return 'Network error. Please check your connection and try again.';
  }
  return msg;
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  return date.toLocaleTimeString('en-GY', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function VerificationTab() {
  const [verificationTab, setVerificationTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [contractors, setContractors] = useState<PendingContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.warn('No active session — cannot fetch verifications');
        setContractors([]);
        return;
      }

      const contractorResult = await supabase
        .from('contractors')
        .select('*')
        .in('verification_status', ['pending', 'verified', 'rejected'])
        .order('created_at', { ascending: false });

      if (contractorResult.error) throw contractorResult.error;
      if (!contractorResult.data || contractorResult.data.length === 0) {
        setContractors([]);
        return;
      }

      const profileIds = contractorResult.data.map((c: any) => c.profile_id);
      const profileResult = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', profileIds);

      if (profileResult.error) throw profileResult.error;

      const profileMap = new Map(profileResult.data?.map((p: any) => [p.id, p]) || []);

      const merged = contractorResult.data.map((c: any) => ({
        ...c,
        full_name: profileMap.get(c.profile_id)?.full_name || 'Unknown',
        phone: profileMap.get(c.profile_id)?.phone || null,
      }));

      setContractors(merged);
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Filter client-side so approving/rejecting a row moves it between tabs
  // instead of making it vanish entirely.
  const filtered = contractors.filter((c) => {
    if (verificationTab === 'pending') return c.verification_status === 'pending';
    if (verificationTab === 'approved') return c.verification_status === 'verified' || c.verification_status === 'approved';
    if (verificationTab === 'rejected') return c.verification_status === 'rejected';
    return true;
  });

  const handleApprove = async (contractor: PendingContractor) => {
    setActionLoading(contractor.id);
    setFeedback(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setFeedback({ type: 'error', message: 'No active session. Please log in and try again.' });
        return;
      }

      const badgeExpiryDate = new Date();
      badgeExpiryDate.setMonth(badgeExpiryDate.getMonth() + 6);

      const { error: updateError } = await supabase
        .from('contractors')
        .update({
          verification_status: 'verified',
          verified: true,
        })
        .eq('id', contractor.id);

      if (updateError) throw updateError;

      const { error: badgeError } = await supabase
        .from('badges')
        .insert({
          contractor_id: contractor.id,
          badge_type: 'verified',
          awarded_at: new Date().toISOString(),
          badge_expiry_date: badgeExpiryDate.toISOString(),
          review_count_last_6_months: 0,
        });

      if (badgeError) throw badgeError;

      setFeedback({ type: 'success', message: `${contractor.full_name} has been approved and verified.` });
      setContractors((prev) => prev.map((c) => c.id === contractor.id ? { ...c, verification_status: 'verified' } : c));
    } catch (err) {
      console.error('Approve error:', err);
      setFeedback({ type: 'error', message: formatError(err) });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (contractor: PendingContractor) => {
    setActionLoading(contractor.id);
    setFeedback(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setFeedback({ type: 'error', message: 'No active session. Please log in and try again.' });
        return;
      }

      const { error: updateError } = await supabase
        .from('contractors')
        .update({
          verification_status: 'rejected',
          verified: false,
        })
        .eq('id', contractor.id);

      if (updateError) throw updateError;

      setFeedback({ type: 'success', message: `${contractor.full_name} has been rejected.` });
      setContractors((prev) => prev.map((c) => c.id === contractor.id ? { ...c, verification_status: 'rejected' } : c));
    } catch (err) {
      console.error('Reject error:', err);
      setFeedback({ type: 'error', message: formatError(err) });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReinstate = async (contractor: PendingContractor) => {
    setActionLoading(contractor.id);
    setFeedback(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setFeedback({ type: 'error', message: 'No active session. Please log in and try again.' });
        return;
      }

      const { error: updateError } = await supabase
        .from('contractors')
        .update({
          verification_status: 'verified',
          verified: true,
        })
        .eq('id', contractor.id);

      if (updateError) throw updateError;

      setFeedback({ type: 'success', message: `${contractor.full_name} has been reinstated to approved.` });
      setContractors((prev) => prev.map((c) => c.id === contractor.id ? { ...c, verification_status: 'verified' } : c));
    } catch (err) {
      console.error('Reinstate error:', err);
      setFeedback({ type: 'error', message: formatError(err) });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const handleDownloadAllDocs = async (contractor: PendingContractor) => {
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();
      const folder = zip.folder(`${contractor.full_name.replace(/\s+/g, '_')}_documents`);

      const docFields: { key: string; label: string }[] = [
        { key: 'doc_business_reg', label: 'Business_Registration' },
        { key: 'doc_gra', label: 'GRA_Compliance' },
        { key: 'doc_nis', label: 'NIS_Compliance' },
        { key: 'doc_profile', label: 'Company_Profile' },
      ];

      const { data: fullContractor } = await supabase
        .from('contractors')
        .select('doc_business_reg, doc_gra, doc_nis, doc_profile, verification_doc_url')
        .eq('id', contractor.id)
        .maybeSingle();

      if (!fullContractor) return;

      const allDocs = [
        ...docFields.map((df) => ({ url: (fullContractor as any)[df.key], label: df.label })),
        { url: fullContractor.verification_doc_url, label: 'Verification_Document' },
      ];

      const downloadPromises = allDocs
        .filter((d) => d.url)
        .map(async (doc) => {
          try {
            const response = await fetch(doc.url);
            const blob = await response.blob();
            const ext = blob.type.includes('pdf') ? '.pdf' : blob.type.includes('png') ? '.png' : '.jpg';
            folder?.file(`${doc.label}${ext}`, blob);
          } catch {
            // skip files that fail to download
          }
        });

      await Promise.all(downloadPromises);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${contractor.full_name.replace(/\s+/g, '_')}_documents.zip`);
    } catch (err) {
      console.error('ZIP download failed:', err);
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  return (
    <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
      <div className="p-5 border-b border-background-200/70">
        <h2 className="font-heading text-lg text-foreground-900">Contractor Verification</h2>
        <p className="text-sm text-foreground-600 mt-1">
          {filtered.length} {statusLabels[verificationTab].toLowerCase()} contractor{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-background-200/70">
        {(['pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setVerificationTab(tab)}
            className={`flex-1 py-3 px-4 text-sm font-label font-medium transition-colors cursor-pointer whitespace-nowrap ${
              verificationTab === tab
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-foreground-600 hover:text-foreground-800 hover:bg-background-50'
            }`}
          >
            {statusLabels[tab]}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`m-5 p-3 rounded-md border ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
        }`}>
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>{feedback.message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <i className="ri-check-double-line text-3xl text-foreground-400" />
          </div>
          <p className="text-foreground-600 text-sm font-label">No {statusLabels[verificationTab].toLowerCase()} contractors</p>
          <p className="text-foreground-500 text-xs mt-1">
            {verificationTab === 'pending' ? 'All verification requests have been processed.' : 'Nothing to show here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background-50 border-b border-background-200/70">
                <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Tradesperson</th>
                <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Category</th>
                <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs">Region</th>
                <th className="text-left px-4 py-3 text-foreground-600 font-label font-medium text-xs hidden sm:table-cell">Experience</th>
                <th className="text-center px-4 py-3 text-foreground-600 font-label font-medium text-xs">Document</th>
                <th className="text-center px-4 py-3 text-foreground-600 font-label font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => window.location.href = `/control-panel/verification/${c.profile_id}`}
                      className="text-left hover:text-primary-500 transition-colors cursor-pointer"
                    >
                      <p className="text-foreground-800 text-xs font-medium">{c.full_name}</p>
                      <p className="text-foreground-500 text-xs">{c.phone || 'No phone'}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">
                      {c.category}
                    </span>
                    {c.other_trade_description && (
                      <p className="text-xs text-foreground-500 mt-1 italic">{c.other_trade_description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground-600 text-xs">{c.region}</td>
                  <td className="px-4 py-3 text-foreground-600 text-xs hidden sm:table-cell">
                    {c.years_experience ? `${c.years_experience} yrs` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.verification_doc_url ? (
                      <a
                        href={c.verification_doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-background-50 hover:bg-background-100 text-foreground-700 text-xs font-label font-medium rounded-md border border-background-200/70 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <div className="w-3 h-3 flex items-center justify-center"><i className="ri-file-line" /></div>
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-foreground-400">No file</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {verificationTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(c)}
                            disabled={actionLoading === c.id}
                            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                          >
                            {actionLoading === c.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(c)}
                            disabled={actionLoading === c.id}
                            className="px-3 py-1.5 bg-accent-100 hover:bg-accent-200/70 text-accent-800 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                          >
                            {actionLoading === c.id ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {verificationTab === 'approved' && (
                        <button
                          onClick={() => handleReject(c)}
                          disabled={actionLoading === c.id}
                          className="px-3 py-1.5 bg-accent-100 hover:bg-accent-200/70 text-accent-800 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                        >
                          {actionLoading === c.id ? '...' : 'Revoke'}
                        </button>
                      )}
                      {verificationTab === 'rejected' && (
                        <button
                          onClick={() => handleReinstate(c)}
                          disabled={actionLoading === c.id}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                        >
                          {actionLoading === c.id ? '...' : 'Reinstate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const DEFAULT_SETTINGS: PlatformSetting[] = [
  { key: 'receiving_bank_details', value: '' },
  { key: 'mmg_paybill_number', value: '' },
  { key: 'wipay_merchant_id', value: '' },
  { key: 'credit_to_gyd_rate', value: '1500' },
  { key: 'contact_address', value: 'Georgetown, Guyana — Serving All 10 Regions' },
  { key: 'contact_phone', value: '+592 226-4567' },
  { key: 'contact_email', value: 'support@buildguyana.com' },
  { key: 'social_facebook', value: 'https://facebook.com/buildguyana' },
  { key: 'social_instagram', value: 'https://instagram.com/buildguyana' },
  { key: 'social_whatsapp', value: 'https://wa.me/5926000000' },
  { key: 'stat_tradespeople', value: '0' },
  { key: 'stat_jobs', value: '0' },
  { key: 'stat_rating', value: '4.8' },
  { key: 'stat_regions', value: '10' },
  { key: 'tnc_text', value: '' },
  { key: 'show_tnc_on_startup', value: 'false' },
  { key: 'privacy_policy_text', value: '' },
  { key: 'show_privacy_on_login', value: 'false' },
  { key: 'cookie_policy_text', value: '' },
  { key: 'show_cookie_on_login', value: 'false' },
  { key: 'policy_version', value: '1' },
  { key: 'hide_mock_testimonials', value: 'false' },
];

function SettingsTab() {
  const [settings, setSettings] = useState<PlatformSetting[]>(DEFAULT_SETTINGS);
  const [dirtySettings, setDirtySettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.warn('No active session — cannot fetch platform settings');
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      const result = await supabase
        .from('platform_settings')
        .select('key, value');

      if (result.error) throw result.error;

      const data = result.data || [];
      const merged = DEFAULT_SETTINGS.map((ds) => {
        const found = data.find((d: any) => d.key === ds.key);
        return found ? { key: ds.key, value: found.value } : ds;
      });

      setSettings(merged);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setDirtySettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setFeedback({ type: 'error', message: 'No active session. Please log in and try again.' });
        return;
      }

      const toSave = Object.entries(dirtySettings);
      const errors: string[] = [];

      for (const [key, value] of toSave) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) errors.push(error.message);
      }

      // Auto-bump the policy version when any legal/policy text changes, so
      // logged-in users are prompted to re-accept on their next login.
      const policyKeys = ['tnc_text', 'privacy_policy_text', 'cookie_policy_text'];
      const policyChanged = toSave.some(([key]) => policyKeys.includes(key));

      if (policyChanged && errors.length === 0) {
        const currentVersion = parseInt(
          settings.find((s) => s.key === 'policy_version')?.value || '1',
          10
        ) || 1;
        const newVersion = currentVersion + 1;
        const { error: versionErr } = await supabase
          .from('platform_settings')
          .upsert({ key: 'policy_version', value: String(newVersion), updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (versionErr) {
          errors.push(versionErr.message);
        } else {
          setSettings((prev) => prev.map((s) =>
            s.key === 'policy_version' ? { ...s, value: String(newVersion) } : s
          ));
        }
      }

      if (errors.length > 0) {
        setFeedback({ type: 'error', message: formatError(errors.join(', ')) });
      } else {
        setFeedback({ type: 'success', message: 'All settings saved successfully.' });
        setSettings((prev) =>
          prev.map((s) => (dirtySettings[s.key] !== undefined ? { ...s, value: dirtySettings[s.key] } : s))
        );
        setDirtySettings({});
        setLastSavedAt(new Date());
      }
    } catch (err) {
      setFeedback({ type: 'error', message: formatError(err) });
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string): string => {
    if (dirtySettings[key] !== undefined) return dirtySettings[key];
    const setting = settings.find((s) => s.key === key);
    return setting?.value || '';
  };

  if (loading) {
    return (
      <div className="bg-white border border-background-200/70 rounded-lg flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
      <div className="p-5 border-b border-background-200/70">
        <h2 className="font-heading text-lg text-foreground-900">Platform Settings</h2>
        <p className="text-sm text-foreground-600 mt-1">Configure global platform parameters</p>
      </div>

      {feedback && (
        <div className={`m-5 p-3 rounded-md border ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
        }`}>
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>{feedback.message}</p>
        </div>
      )}

      <div className="p-5 space-y-5">
        <div>
          <label htmlFor="bank-details" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Receiving Bank Account Details
          </label>
          <textarea
            id="bank-details"
            value={getValue('receiving_bank_details')}
            onChange={(e) => handleChange('receiving_bank_details', e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
            placeholder="Bank name, account number, account holder name, branch..."
          />
        </div>

        <div>
          <label htmlFor="mmg-paybill" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            MMG Paybill / Till Number
          </label>
          <input
            id="mmg-paybill"
            type="text"
            value={getValue('mmg_paybill_number')}
            onChange={(e) => handleChange('mmg_paybill_number', e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
            placeholder="e.g. 123456"
          />
        </div>

        <div>
          <label htmlFor="wipay-merchant" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            WiPay Merchant ID
          </label>
          <input
            id="wipay-merchant"
            type="text"
            value={getValue('wipay_merchant_id')}
            onChange={(e) => handleChange('wipay_merchant_id', e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
            placeholder="WiPay Merchant ID..."
          />
        </div>

        <div>
          <label htmlFor="credit-rate" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Current Credit to GYD Exchange Rate
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-500 font-label">1 Credit = GYD $</span>
            <input
              id="credit-rate"
              type="number"
              value={getValue('credit_to_gyd_rate')}
              onChange={(e) => handleChange('credit_to_gyd_rate', e.target.value)}
              min="1"
              className="w-32 px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
              placeholder="1500"
            />
          </div>
          <p className="text-xs text-foreground-500 mt-1">Default: 1500 GYD per credit</p>
        </div>

        <div className="pt-2 border-t border-background-200/70">
          <h3 className="font-heading text-sm text-foreground-900 mb-3">Contact Information (Footer)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Phone Number
              </label>
              <input
                id="contact-phone"
                type="text"
                value={getValue('contact_phone')}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                placeholder="+592 226-4567"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                value={getValue('contact_email')}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                placeholder="support@buildguyana.com"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="contact-address" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Physical Address
              </label>
              <input
                id="contact-address"
                type="text"
                value={getValue('contact_address')}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                placeholder="Georgetown, Guyana — Serving All 10 Regions"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-background-200/70">
          <h3 className="font-heading text-sm text-foreground-900 mb-3">Legal & Terms</h3>
          <div className="flex items-start gap-2 p-3 bg-background-50 border border-background-200/70 rounded-md mb-4">
            <div className="w-4 h-4 flex items-center justify-center mt-0.5 shrink-0">
              <i className="ri-information-line text-foreground-500 text-sm" />
            </div>
            <p className="text-xs text-foreground-600">
              Current policy version: <strong className="text-foreground-900">{getValue('policy_version') || '1'}</strong>. Saving changes to any legal text below will automatically bump the version and prompt users to re-accept on their next login.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="tnc-text" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Terms & Conditions Text
              </label>
              <textarea
                id="tnc-text"
                value={getValue('tnc_text')}
                onChange={(e) => handleChange('tnc_text', e.target.value)}
                rows={8}
                maxLength={5000}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
                placeholder="Enter your platform terms and conditions here..."
              />
              <p className="text-xs text-foreground-400 mt-1">Displayed to users on login when TNC prompt is enabled.</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-50 border border-background-200/70 rounded-md">
              <div>
                <h4 className="font-label text-sm font-medium text-foreground-900">Show TNC on Login</h4>
                <p className="text-xs text-foreground-500 mt-0.5">When enabled, users must accept the Terms & Conditions before signing in.</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('show_tnc_on_startup', getValue('show_tnc_on_startup') === 'true' ? 'false' : 'true')}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  getValue('show_tnc_on_startup') === 'true' ? 'bg-primary-500' : 'bg-background-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    getValue('show_tnc_on_startup') === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-background-200/70">
          <h3 className="font-heading text-sm text-foreground-900 mb-3">Privacy Notice</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="privacy-text" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Privacy Notice Text
              </label>
              <textarea
                id="privacy-text"
                value={getValue('privacy_policy_text')}
                onChange={(e) => handleChange('privacy_policy_text', e.target.value)}
                rows={8}
                maxLength={5000}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
                placeholder="Enter your platform privacy policy here..."
              />
              <p className="text-xs text-foreground-400 mt-1">Displayed to users on login when Privacy Notice prompt is enabled.</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-50 border border-background-200/70 rounded-md">
              <div>
                <h4 className="font-label text-sm font-medium text-foreground-900">Show Privacy Notice on Login</h4>
                <p className="text-xs text-foreground-500 mt-0.5">When enabled, users must accept the Privacy Notice update before continuing.</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('show_privacy_on_login', getValue('show_privacy_on_login') === 'true' ? 'false' : 'true')}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  getValue('show_privacy_on_login') === 'true' ? 'bg-primary-500' : 'bg-background-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    getValue('show_privacy_on_login') === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-background-200/70">
          <h3 className="font-heading text-sm text-foreground-900 mb-3">Cookie Policy</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="cookie-text" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Cookie Policy Text
              </label>
              <textarea
                id="cookie-text"
                value={getValue('cookie_policy_text')}
                onChange={(e) => handleChange('cookie_policy_text', e.target.value)}
                rows={8}
                maxLength={5000}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
                placeholder="Enter your platform cookie policy here..."
              />
              <p className="text-xs text-foreground-400 mt-1">Displayed to users on login when Cookie Policy prompt is enabled.</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-50 border border-background-200/70 rounded-md">
              <div>
                <h4 className="font-label text-sm font-medium text-foreground-900">Show Cookie Policy on Login</h4>
                <p className="text-xs text-foreground-500 mt-0.5">When enabled, users must accept the Cookie Policy update before continuing.</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('show_cookie_on_login', getValue('show_cookie_on_login') === 'true' ? 'false' : 'true')}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  getValue('show_cookie_on_login') === 'true' ? 'bg-primary-500' : 'bg-background-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    getValue('show_cookie_on_login') === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-background-200/70">
          <h3 className="font-heading text-sm text-foreground-900 mb-3">Mock Data Display</h3>
          <div className="flex items-center justify-between p-4 bg-background-50 border border-background-200/70 rounded-md">
            <div>
              <h4 className="font-label text-sm font-medium text-foreground-900">Hide Mock Testimonials</h4>
              <p className="text-xs text-foreground-500 mt-0.5">When enabled, the homepage testimonials section will show a "Coming Soon" placeholder instead of mock data when no real testimonials exist.</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('hide_mock_testimonials', getValue('hide_mock_testimonials') === 'true' ? 'false' : 'true')}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                getValue('hide_mock_testimonials') === 'true' ? 'bg-primary-500' : 'bg-background-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  getValue('hide_mock_testimonials') === 'true' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-background-200/70">
          <h3 className="font-heading text-sm text-foreground-900 mb-3">Social Media Links (Footer)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="social-facebook" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Facebook URL
              </label>
              <input
                id="social-facebook"
                type="url"
                value={getValue('social_facebook')}
                onChange={(e) => handleChange('social_facebook', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                placeholder="https://facebook.com/buildguyana"
              />
            </div>
            <div>
              <label htmlFor="social-instagram" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Instagram URL
              </label>
              <input
                id="social-instagram"
                type="url"
                value={getValue('social_instagram')}
                onChange={(e) => handleChange('social_instagram', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                placeholder="https://instagram.com/buildguyana"
              />
            </div>
            <div>
              <label htmlFor="social-whatsapp" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                WhatsApp URL
              </label>
              <input
                id="social-whatsapp"
                type="url"
                value={getValue('social_whatsapp')}
                onChange={(e) => handleChange('social_whatsapp', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                placeholder="https://wa.me/5926000000"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-background-200/70">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-eye-line text-foreground-500 text-sm" />
            </div>
            <span className="text-xs font-label font-semibold text-foreground-600 uppercase tracking-wider">Live Preview</span>
          </div>
          <div className="bg-secondary-900 rounded-lg p-5 border border-secondary-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Contact Preview */}
              <div>
                <h4 className="font-label text-[10px] font-semibold uppercase tracking-wider text-background-400 mb-2.5">Contact</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 flex items-center justify-center mt-px">
                      <i className="ri-map-pin-line text-background-400 text-xs" />
                    </div>
                    <span className="text-xs text-background-300 leading-relaxed">
                      {getValue('contact_address') || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 flex items-center justify-center mt-px">
                      <i className="ri-phone-line text-background-400 text-xs" />
                    </div>
                    <span className="text-xs text-background-300">
                      {getValue('contact_phone') || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 flex items-center justify-center mt-px">
                      <i className="ri-mail-line text-background-400 text-xs" />
                    </div>
                    <span className="text-xs text-background-300">
                      {getValue('contact_email') || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Social Icons Preview */}
              <div>
                <h4 className="font-label text-[10px] font-semibold uppercase tracking-wider text-background-400 mb-2.5">Social Links</h4>
                <div className="flex items-center gap-3">
                  {[
                    { key: 'social_facebook', icon: 'ri-facebook-fill', label: 'Facebook' },
                    { key: 'social_instagram', icon: 'ri-instagram-fill', label: 'Instagram' },
                    { key: 'social_whatsapp', icon: 'ri-whatsapp-fill', label: 'WhatsApp' },
                  ].map((social) => {
                    const url = getValue(social.key);
                    return (
                      <div key={social.key} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          url ? 'bg-secondary-800 hover:bg-primary-500' : 'bg-secondary-800 opacity-50'
                        }`}>
                          <i className={`${social.icon} text-xs ${url ? 'text-background-300' : 'text-background-600'}`} />
                        </div>
                        <span className="text-[9px] text-background-500">{social.label}</span>
                        {!url && <span className="text-[8px] text-accent-500">empty</span>}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-background-500 mt-3">
                  Icons with URLs highlight on hover. Empty URLs appear dimmed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(dirtySettings).length === 0}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <div className="mt-2 min-h-[18px]">
            {Object.keys(dirtySettings).length > 0 ? (
              <span className="text-xs text-accent-600 font-label">Unsaved changes</span>
            ) : lastSavedAt ? (
              <span className="text-xs text-foreground-500">
                Last saved: {formatTimeAgo(lastSavedAt)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditManagementTab() {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string; email: string; phone: string | null; full_name: string } | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [creditAmount, setCreditAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setFeedback(null);
    setFoundUser(null);
    setWalletId(null);

    try {
      const cleanedPhone = search.trim().replace(/\D/g, '');

      // Search profiles by phone
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('is_tradesperson', true)
        .filter('phone', 'ilike', `%${cleanedPhone}%`);

      if (pError) throw pError;

      if (!profiles || profiles.length === 0) {
        setFeedback({ type: 'error', message: 'No tradesperson found with that phone number.' });
        return;
      }

      const userProfile = profiles[0];

      // Get contractor record
      const { data: contractor } = await supabase
        .from('contractors')
        .select('id')
        .eq('profile_id', userProfile.id)
        .maybeSingle();

      if (!contractor) {
        setFeedback({ type: 'error', message: 'Contractor record not found for this user.' });
        return;
      }

      // Get wallet
      const { data: walletData } = await supabase
        .from('contractor_wallet')
        .select('id, balance_credits')
        .eq('contractor_id', contractor.id)
        .maybeSingle();

      setFoundUser({
        id: contractor.id,
        email: '',
        phone: userProfile.phone,
        full_name: userProfile.full_name,
      });
      setWalletId(walletData?.id || null);
      setCurrentBalance(walletData?.balance_credits || 0);
    } catch (err: any) {
      console.error('Credit search failed:', err);
      setFeedback({ type: 'error', message: formatError(err) });
    } finally {
      setSearching(false);
    }
  };

  const handleAddCredits = async () => {
    const amount = parseInt(creditAmount, 10);
    if (!amount || amount <= 0 || !foundUser) return;

    setAdding(true);
    setFeedback(null);

    try {
      // Auto-create wallet if it doesn't exist yet
      let targetWalletId = walletId;

      if (!targetWalletId) {
        const { data: newWallet, error: createErr } = await supabase
          .from('contractor_wallet')
          .insert({
            contractor_id: foundUser.id,
            balance_credits: 0,
          })
          .select('id')
          .single();

        if (createErr) {
          setFeedback({ type: 'error', message: `Failed to create wallet: ${createErr.message} (code: ${createErr.code})` });
          return;
        }
        targetWalletId = newWallet.id;
        setWalletId(targetWalletId);
        setCurrentBalance(0);
      }

      // Update wallet balance
      const newBalance = currentBalance + amount;
      const { error: walletErr, data: walletUpdateData } = await supabase
        .from('contractor_wallet')
        .update({ balance_credits: newBalance, updated_at: new Date().toISOString() })
        .eq('id', targetWalletId)
        .select('id');

      if (walletErr) {
        setFeedback({ type: 'error', message: `[wallet update] ${walletErr.message} (code: ${walletErr.code})` });
        return;
      }

      if (!walletUpdateData || walletUpdateData.length === 0) {
        setFeedback({ type: 'error', message: 'Wallet update returned no rows — check RLS policies for contractor_wallet.' });
        return;
      }

      // Insert transaction record (new schema)
      const gydAmount = amount * 500;
      const { error: txErr } = await supabase
        .from('wallet_transactions')
        .insert({
          contractor_id: foundUser.id,
          amount_credits: amount,
          amount_gyd: gydAmount,
          transaction_type: 'admin_adjustment',
          status: 'approved',
          admin_notes: 'Manual credit added by admin',
          created_at: new Date().toISOString(),
        });

      if (txErr) {
        // Rollback wallet balance on transaction insert failure
        await supabase
          .from('contractor_wallet')
          .update({ balance_credits: currentBalance, updated_at: new Date().toISOString() })
          .eq('id', targetWalletId);

        setFeedback({ type: 'error', message: `[transaction insert] ${txErr.message} (code: ${txErr.code})` });
        return;
      }

      setCurrentBalance(newBalance);
      setCreditAmount('');
      setFeedback({ type: 'success', message: `Added ${amount} credits to ${foundUser.full_name}. New balance: ${newBalance}` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message ? `Unexpected error: ${err.message}` : formatError(err) });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
      <div className="p-5 border-b border-background-200/70">
        <h2 className="font-heading text-lg text-foreground-900">User Credit Management</h2>
        <p className="text-sm text-foreground-600 mt-1">Search tradespeople and add credits to their wallet</p>
      </div>

      {feedback && (
        <div className={`m-5 p-3 rounded-md border ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
        }`}>
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>{feedback.message}</p>
        </div>
      )}

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Search Tradesperson by Phone Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. 6123456"
              className="flex-1 px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !search.trim()}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {foundUser && (
          <div className="p-4 bg-background-50 border border-background-200/70 rounded-lg space-y-4">
            <div>
              <h3 className="font-heading text-base text-foreground-900">{foundUser.full_name}</h3>
              <p className="text-sm text-foreground-500">
                Phone: {foundUser.phone || 'N/A'} &middot; Current Balance: <strong className="text-foreground-900">{currentBalance} Credits</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                Credits to Add
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1 px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                />
                <button
                  onClick={handleAddCredits}
                  disabled={adding || !creditAmount || parseInt(creditAmount, 10) <= 0}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {adding ? 'Adding...' : 'Add Credits'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [mode, setMode] = useState<'mass' | 'grouped' | 'individual'>('mass');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleUserSearch = async () => {
    if (!userSearch.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${userSearch.trim()}%`)
        .limit(20);

      if (data) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          full_name: p.full_name || 'Unknown',
          email: '',
        }));
        setSearchResults(mapped);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggleUserSelection = (user: { id: string; full_name: string }) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      if (mode === 'individual') return [user];
      return [...prev, user];
    });
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: 'Title and message are required.' });
      return;
    }

    if (mode === 'individual' && selectedUsers.length !== 1) {
      setFeedback({ type: 'error', message: 'Please select exactly one user for individual notifications.' });
      return;
    }

    if (mode === 'grouped' && selectedUsers.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one user for grouped notifications.' });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      if (mode === 'mass') {
        // Insert a single broadcast row
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: null,
            title: title.trim(),
            message: message.trim(),
            is_read: false,
            sender_type: 'system',
            is_broadcast: true,
          });

        if (error) throw error;
        setFeedback({ type: 'success', message: 'Mass notification sent! All users will see it in their notifications.' });
      } else {
        // Individual or Grouped — insert per-user rows
        const rows = selectedUsers.map((u) => ({
          user_id: u.id,
          title: title.trim(),
          message: message.trim(),
          is_read: false,
          sender_type: 'admin',
          is_broadcast: false,
        }));

        const { error } = await supabase.from('notifications').insert(rows);
        if (error) throw error;

        setFeedback({
          type: 'success',
          message: `Notification sent to ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}!`,
        });
      }

      // Reset form
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
      setSearchResults([]);
      setUserSearch('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to send notification.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
      <div className="p-5 border-b border-background-200/70">
        <h2 className="font-heading text-lg text-foreground-900">Send Notifications</h2>
        <p className="text-sm text-foreground-600 mt-1">Push notifications to BuildGuyana.gy users</p>
      </div>

      {feedback && (
        <div className={`m-5 p-3 rounded-md border ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
        }`}>
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>{feedback.message}</p>
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Mode Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground-700 mb-2 font-label">
            Notification Type
          </label>
          <div className="flex gap-1 bg-background-100 rounded-lg p-1 w-fit">
            {([
              { key: 'mass' as const, label: 'Mass (Everyone)', desc: 'Broadcast' },
              { key: 'grouped' as const, label: 'Grouped', desc: 'Select multiple' },
              { key: 'individual' as const, label: 'Individual', desc: 'One user' },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setMode(opt.key); setSelectedUsers([]); }}
                className={`px-4 py-2 text-sm font-label font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === opt.key
                    ? 'bg-white text-foreground-900 shadow-sm'
                    : 'text-foreground-500 hover:text-foreground-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-foreground-400 mt-1.5">
            {mode === 'mass'
              ? 'Sends to all users as a broadcast notification. Sender shows as "BuildGuyana.gy".'
              : mode === 'grouped'
                ? 'Send to multiple users you select. Sender shows as "Admin".'
                : 'Send to one specific user. Sender shows as "Admin".'}
          </p>
        </div>

        {/* User Selection (Grouped & Individual) */}
        {mode !== 'mass' && (
          <div>
            <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
              {mode === 'individual' ? 'Select User' : 'Select Users'}
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                placeholder="Search by name..."
                className="flex-1 px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
              />
              <button
                onClick={handleUserSearch}
                disabled={searching || !userSearch.trim()}
                className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Selected badges */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedUsers.map((u) => (
                  <span key={u.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-label rounded-full border border-primary-200/70">
                    {u.full_name}
                    <button
                      onClick={() => toggleUserSelection(u)}
                      className="w-3.5 h-3.5 flex items-center justify-center cursor-pointer"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="border border-background-200/70 rounded-md max-h-48 overflow-y-auto">
                {searchResults.map((u) => {
                  const isSelected = selectedUsers.some((s) => s.id === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUserSelection({ id: u.id, full_name: u.full_name })}
                      disabled={mode === 'individual' && selectedUsers.length >= 1 && !isSelected}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors cursor-pointer border-b border-background-100 last:border-0 ${
                        isSelected
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-foreground-700 hover:bg-background-50'
                      } ${mode === 'individual' && selectedUsers.length >= 1 && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span>{u.full_name}</span>
                      {isSelected && (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-check-line text-primary-500 text-sm" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="notif-title" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Notification Title <span className="text-accent-500">*</span>
          </label>
          <input
            id="notif-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
            placeholder="e.g. Platform Maintenance Scheduled"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="notif-message" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
            Message <span className="text-accent-500">*</span>
          </label>
          <textarea
            id="notif-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors resize-vertical"
            placeholder="Enter the notification message..."
          />
          <p className="text-xs text-foreground-400 mt-1">{message.length}/500</p>
        </div>

        {/* Send */}
        <div className="pt-2">
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim() || (mode !== 'mass' && selectedUsers.length === 0)}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-background-50 border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-send-plane-line" />
                </div>
                Send {mode === 'mass' ? 'to Everyone' : mode === 'grouped' ? `to ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}` : 'to User'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DataManagementTab() {
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleWipe = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setFeedback({ type: 'error', message: 'No active session. Please log in and try again.' });
        setWipeConfirm(false);
        return;
      }

      // Collect mock contractor IDs before deletion (wallet has no is_mock_data column)
      const { data: existingMockContractors } = await supabase
        .from('contractors')
        .select('id')
        .eq('is_mock_data', true);

      const mockContractorIds = (existingMockContractors || []).map((c: any) => c.id);

      // Delete wallet entries for mock contractors FIRST (before contractors are deleted)
      if (mockContractorIds.length > 0) {
        const { error: walletErr } = await supabase
          .from('contractor_wallet')
          .delete()
          .in('contractor_id', mockContractorIds);
        if (walletErr) throw new Error(`[contractor_wallet] ${walletErr.message} (code: ${walletErr.code})`);
      }

      // Delete in FK-safe order
      const { error: reviewsErr } = await supabase.from('reviews').delete().eq('is_mock_data', true);
      if (reviewsErr) throw new Error(`[reviews] ${reviewsErr.message} (code: ${reviewsErr.code})`);

      const { error: jobsErr } = await supabase.from('jobs').delete().eq('is_mock_data', true);
      if (jobsErr) throw new Error(`[jobs] ${jobsErr.message} (code: ${jobsErr.code})`);

      const { error: ctErr } = await supabase.from('contractors').delete().eq('is_mock_data', true);
      if (ctErr) throw new Error(`[contractors] ${ctErr.message} (code: ${ctErr.code})`);

      const { error: profErr } = await supabase.from('profiles').delete().eq('is_mock_data', true);
      if (profErr) throw new Error(`[profiles] ${profErr.message} (code: ${profErr.code})`);

      setFeedback({ type: 'success', message: 'All mock data has been wiped successfully (profiles, contractors, wallets, jobs, reviews).' });
    } catch (err: any) {
      console.error('Wipe failed:', err);
      setFeedback({ type: 'error', message: err.message || formatError(err) });
    } finally {
      setLoading(false);
      setWipeConfirm(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setFeedback({ type: 'error', message: 'No active session. Please log in and try again.' });
        setRestoreConfirm(false);
        return;
      }

      // ── STEP 1: Wipe all existing mock data first ──
      const { data: existingMockContractors } = await supabase
        .from('contractors')
        .select('id')
        .eq('is_mock_data', true);

      const existingMockIds = (existingMockContractors || []).map((c: any) => c.id);
      if (existingMockIds.length > 0) {
        const { error: wErr } = await supabase.from('contractor_wallet').delete().in('contractor_id', existingMockIds);
        if (wErr) throw new Error(`[pre-wipe contractor_wallet] ${wErr.message} (code: ${wErr.code})`);
      }

      const { error: rvErr } = await supabase.from('reviews').delete().eq('is_mock_data', true);
      if (rvErr) throw new Error(`[pre-wipe reviews] ${rvErr.message} (code: ${rvErr.code})`);

      const { error: jbErr } = await supabase.from('jobs').delete().eq('is_mock_data', true);
      if (jbErr) throw new Error(`[pre-wipe jobs] ${jbErr.message} (code: ${jbErr.code})`);

      const { error: ctErr } = await supabase.from('contractors').delete().eq('is_mock_data', true);
      if (ctErr) throw new Error(`[pre-wipe contractors] ${ctErr.message} (code: ${ctErr.code})`);

      const { error: pfErr } = await supabase.from('profiles').delete().eq('is_mock_data', true);
      if (pfErr) throw new Error(`[pre-wipe profiles] ${pfErr.message} (code: ${pfErr.code})`);

      // ── STEP 2: Build mock data with fresh UUIDs ──
      const profileIds: string[] = [];
      const contractorIds: string[] = [];

      const mockProfiles = tradespeople.map((tp, idx) => {
        const id = crypto.randomUUID();
        profileIds.push(id);
        // Parse region from "Region X — Name" format
        const regionParts = tp.region.split(' — ');
        return {
          id,
          role: 'tradesperson',
          full_name: tp.name,
          phone: `5926${String(idx + 1).padStart(7, '0')}`,
          region: regionParts[0],
          location: tp.location,
          is_tradesperson: true,
          is_project_owner: false,
          is_mock_data: true,
        };
      });

      const mockContractors = tradespeople.map((tp, idx) => {
        const id = crypto.randomUUID();
        contractorIds.push(id);
        const regionParts = tp.region.split(' — ');
        return {
          id,
          profile_id: profileIds[idx],
          category: tp.trade,
          categories: [tp.trade],
          region: regionParts[0],
          bio: tp.description,
          years_experience: tp.yearsExperience,
          verified: tp.verified,
          verification_status: tp.verified ? 'verified' : 'pending',
          rating: tp.rating,
          review_count: tp.reviewCount,
          tier: tp.tier,
          id_verification_status: tp.id_verification_status,
          doc_business_reg: tp.doc_business_reg,
          trade_license_status: tp.trade_license_status,
          is_mock_data: true,
        };
      });

      const mockWallets = contractorIds.map((cid) => ({
        contractor_id: cid,
        balance_credits: 20,
      }));

      // ── STEP 3: Insert in dependency order (profiles → contractors → wallets) ──
      const { error: insProfilesErr } = await supabase.from('profiles').insert(mockProfiles);
      if (insProfilesErr) {
        throw new Error(`[profiles insert] ${insProfilesErr.message} (code: ${insProfilesErr.code})\nDetails: ${JSON.stringify(insProfilesErr.details || 'none')}`);
      }

      const { error: insContractorsErr } = await supabase.from('contractors').insert(mockContractors);
      if (insContractorsErr) {
        // Rollback profiles on contractor insert failure
        await supabase.from('profiles').delete().in('id', profileIds);
        throw new Error(`[contractors insert] ${insContractorsErr.message} (code: ${insContractorsErr.code})\nDetails: ${JSON.stringify(insContractorsErr.details || 'none')}`);
      }

      const { error: insWalletsErr } = await supabase.from('contractor_wallet').insert(mockWallets);
      if (insWalletsErr) {
        // Rollback contractors + profiles on wallet failure
        await supabase.from('contractors').delete().in('id', contractorIds);
        await supabase.from('profiles').delete().in('id', profileIds);
        throw new Error(`[contractor_wallet insert] ${insWalletsErr.message} (code: ${insWalletsErr.code})\nDetails: ${JSON.stringify(insWalletsErr.details || 'none')}`);
      }

      // ── STEP 4: Reset marketing stats ──
      const statsDefaults = [
        { key: 'stat_tradespeople', value: String(tradespeople.length) },
        { key: 'stat_jobs', value: '2400' },
        { key: 'stat_rating', value: '4.8' },
        { key: 'stat_regions', value: '10' },
      ];
      for (const stat of statsDefaults) {
        await supabase
          .from('platform_settings')
          .upsert({ key: stat.key, value: stat.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      }

      setFeedback({
        type: 'success',
        message: `Mock data restored: ${mockProfiles.length} profiles, ${mockContractors.length} contractors, ${mockWallets.length} wallets. Stats reset to marketing defaults.`,
      });
    } catch (err: any) {
      console.error('Restore failed:', err);
      setFeedback({ type: 'error', message: err.message || formatError(err) });
    } finally {
      setLoading(false);
      setRestoreConfirm(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-background-200/70">
          <h2 className="font-heading text-lg text-foreground-900">Mock Data Management</h2>
          <p className="text-sm text-foreground-600 mt-1">
            Wipe or restore mock data for development and testing. Only affects rows flagged with <code className="text-xs bg-background-100 px-1.5 py-0.5 rounded">is_mock_data = true</code>.
          </p>
        </div>

        {feedback && (
          <div className={`m-5 p-3 rounded-md border ${
            feedback.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-accent-100/80 border-accent-300/60'
          }`}>
            <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>{feedback.message}</p>
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-background-50 border border-background-200/70 rounded-lg">
            <div>
              <h3 className="font-heading text-sm text-foreground-900 mb-1">Wipe All Mock Data</h3>
              <p className="text-xs text-foreground-500">Deletes all profiles, contractors, jobs, and reviews where is_mock_data is true.</p>
            </div>
            {!wipeConfirm ? (
              <button
                onClick={() => setWipeConfirm(true)}
                className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                Wipe Mock Data
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-accent-600 font-label">Are you sure?</span>
                <button
                  onClick={handleWipe}
                  disabled={loading}
                  className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {loading ? 'Wiping...' : 'Yes, Wipe'}
                </button>
                <button
                  onClick={() => setWipeConfirm(false)}
                  disabled={loading}
                  className="px-3 py-1.5 border border-background-200/70 text-foreground-600 text-xs font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-background-50 border border-background-200/70 rounded-lg">
            <div>
              <h3 className="font-heading text-sm text-foreground-900 mb-1">Restore Mock Data</h3>
              <p className="text-xs text-foreground-500">Re-inserts the original mock contractors and profiles flagged as is_mock_data = true.</p>
            </div>
            {!restoreConfirm ? (
              <button
                onClick={() => setRestoreConfirm(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                Restore Mock Data
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-600 font-label">This will re-insert mock data. Continue?</span>
                <button
                  onClick={handleRestore}
                  disabled={loading}
                  className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-label font-medium rounded-md transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {loading ? 'Restoring...' : 'Yes, Restore'}
                </button>
                <button
                  onClick={() => setRestoreConfirm(false)}
                  disabled={loading}
                  className="px-3 py-1.5 border border-background-200/70 text-foreground-600 text-xs font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}