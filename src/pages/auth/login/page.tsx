import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { ActiveRole, Profile } from '@/contexts/AuthContext';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid email')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for the confirmation link.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Connection problem. Please check your internet and try again.';
  }
  return message;
}

export default function LoginPage() {
  const { user, session, profile, activeRole, hasDualRoles, loading, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // TNC Modal state
  const [showTncModal, setShowTncModal] = useState(false);
  const [tncText, setTncText] = useState('');
  const [tncLoading, setTncLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Policy Version Check state
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyVersion, setPolicyVersion] = useState(1);
  const [policyTexts, setPolicyTexts] = useState<{ tnc: string; privacy: string; cookie: string }>({ tnc: '', privacy: '', cookie: '' });
  const [policyShows, setPolicyShows] = useState<{ tnc: boolean; privacy: boolean; cookie: boolean }>({ tnc: false, privacy: false, cookie: false });
  const [policyAccepting, setPolicyAccepting] = useState(false);
  const [policyChecked, setPolicyChecked] = useState(false);

  // Resend confirmation state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [showResendModal, setShowResendModal] = useState(false);

  // Fetch TNC and Policy settings on mount
  useEffect(() => {
    const fetchTnc = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', [
            'show_tnc_on_startup', 'tnc_text',
            'show_privacy_on_login', 'privacy_policy_text',
            'show_cookie_on_login', 'cookie_policy_text',
            'policy_version',
          ]);

        if (error || !data) {
          setTncLoading(false);
          return;
        }

        const settings: Record<string, string> = {};
        data.forEach((row: { key: string; value: string }) => {
          settings[row.key] = row.value;
        });

        // Set policy version from settings (default 1)
        const pv = parseInt(settings.policy_version, 10) || 1;
        setPolicyVersion(pv);
        setPolicyTexts({
          tnc: settings.tnc_text || '',
          privacy: settings.privacy_policy_text || '',
          cookie: settings.cookie_policy_text || '',
        });
        setPolicyShows({
          tnc: settings.show_tnc_on_startup === 'true',
          privacy: settings.show_privacy_on_login === 'true',
          cookie: settings.show_cookie_on_login === 'true',
        });

        // Legacy TNC modal — only show if no policy version system active
        if (settings.show_tnc_on_startup === 'true' && settings.tnc_text && pv <= 1) {
          setTncText(settings.tnc_text);
          setShowTncModal(true);
        }

        // Force the Policy modal for an already-signed-in user who has not yet
        // accepted the current policy version (respects session, no repeat prompts).
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        if (sessionUser?.id) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle();

          if (profData) {
            const acceptedVersion = (profData as any).accepted_policy_version || 0;
            const anyActive = settings.show_privacy_on_login === 'true' || settings.show_cookie_on_login === 'true';
            if (pv > acceptedVersion && anyActive) {
              setPendingProfile(profData as Profile);
              setShowPolicyModal(true);
            }
          }
        }
      } catch {
        // silently fail
      } finally {
        setTncLoading(false);
        setPolicyChecked(true);
      }
    };
    fetchTnc();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If already logged in with a single role (context has finished loading), redirect away
  if (!loading && session && activeRole && !hasDualRoles && !showRolePicker && policyChecked && !showPolicyModal) {
    if (activeRole === 'tradesperson') return <Navigate to="/dashboard/tradesperson" replace />;
    if (activeRole === 'admin') return <Navigate to="/bg-ops-7742" replace />;
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(friendlyError(signInError.message));
        setSubmitting(false);
        return;
      }

      const userId = signInData?.user?.id;
      if (!userId) {
        setError('Login succeeded but no user data returned. Please try again.');
        setSubmitting(false);
        return;
      }

      // Fetch profile directly so we can navigate immediately
      // without waiting for the AuthContext's async onAuthStateChange → fetchProfile chain.
      // Retry up to 3 times with backoff — post-login the session may not be
      // immediately available inside the Supabase client's internal getSession().
      let profileData: Profile | null = null;
      let profileError: unknown = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!result.error && result.data) {
          profileData = result.data as Profile;
          profileError = null;
          break;
        }

        profileError = result.error;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }

      if (profileError || !profileData) {
        // Self-healing: if the profile row simply doesn't exist (no error, just no row),
        // create a minimal profile from the auth user's metadata instead of failing.
        // This happens when registration succeeded but the profile INSERT was lost
        // (e.g. session not yet settled, RLS timing, or silent failure).
        if (!profileData && !profileError) {
          const metadata = signInData?.user?.user_metadata || {};
          const rawRole = metadata?.role || 'project_owner';
          const mappedRoleFallback: ActiveRole = rawRole === 'contractor' ? 'tradesperson'
            : rawRole === 'homeowner' ? 'project_owner'
            : (rawRole as ActiveRole);

          const fallbackInsert = await supabase
            .from('profiles')
            .insert({
              id: userId,
              role: mappedRoleFallback,
              full_name: metadata?.full_name || signInData?.user?.email?.split('@')[0] || 'User',
              is_tradesperson: mappedRoleFallback === 'tradesperson',
              is_project_owner: mappedRoleFallback === 'project_owner',
              region: 'Region 4',
            })
            .select('*')
            .maybeSingle();

          if (fallbackInsert.error) {
            setError('Sign in succeeded but we had trouble setting up your account. Please try signing in again.');
            await supabase.auth.signOut();
            setSubmitting(false);
            return;
          }

          profileData = fallbackInsert.data as Profile;
        } else {
          setError('Sign in succeeded but we had trouble loading your account. This is usually temporary — please try signing in again.');
          await supabase.auth.signOut();
          setSubmitting(false);
          return;
        }
      }

      const prof = profileData as Profile;

      // Map legacy role names
      const mappedRole: ActiveRole = prof.role === 'contractor' ? 'tradesperson'
        : prof.role === 'homeowner' ? 'project_owner'
        : (prof.role as ActiveRole);

      // Dual-role users need to pick before we navigate
      if (prof.is_tradesperson && prof.is_project_owner) {
        // Check policy version before showing role picker
        const acceptedVersion = (prof as any).accepted_policy_version || 0;
        const anyPolicyActive = policyShows.privacy || policyShows.cookie;
        if (policyVersion > acceptedVersion && anyPolicyActive) {
          setPendingProfile(prof);
          setShowPolicyModal(true);
          setSubmitting(false);
          return;
        }

        setPendingProfile(prof);
        setShowRolePicker(true);
        setSubmitting(false);
        return;
      }

      // Check policy version for single-role users
      const acceptedVersion = (prof as any).accepted_policy_version || 0;
      const anyPolicyActive = policyShows.privacy;
      if (policyVersion > acceptedVersion && anyPolicyActive) {
        setPendingProfile(prof);
        setShowPolicyModal(true);
        setSubmitting(false);
        return;
      }

      // Single role — navigate immediately, respecting any redirect param
      const target = redirectTo || (
        mappedRole === 'tradesperson' ? '/dashboard/tradesperson'
        : mappedRole === 'admin' ? '/bg-ops-7742'
        : '/'
      );
      navigate(target, { replace: true });
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  // Dual-role picker — shown after a successful login when the user has both profiles.
  // Uses directly-fetched profile data so it renders immediately,
  // without waiting for the AuthContext to catch up.
  if (showRolePicker && pendingProfile) {
    const displayProfile = pendingProfile;

    const handleRoleSelect = (role: ActiveRole) => {
      setActiveRole(role);
      const target = redirectTo || (role === 'tradesperson' ? '/dashboard/tradesperson' : '/');
      navigate(target, { replace: true });
    };

    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-28 pb-16">
          <div className="w-full max-w-md">
            <div className="bg-white border border-background-200/70 rounded-lg p-8">
              <div className="text-center mb-8">
                <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
                  Welcome, {displayProfile.full_name}
                </h1>
                <p className="text-foreground-600 text-sm">
                  You have access to both profiles. Choose how you&apos;d like to continue.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect('project_owner')}
                  className="w-full p-5 border-2 border-background-200/70 rounded-lg text-left hover:border-primary-500 hover:bg-primary-50/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                      <i className="ri-home-4-line text-xl text-secondary-700" />
                    </div>
                    <div>
                      <span className="block text-base font-medium text-foreground-800 font-label">Continue as Project Owner</span>
                      <span className="block text-xs text-foreground-500 mt-0.5">Post jobs, find tradespeople for your projects</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('tradesperson')}
                  className="w-full p-5 border-2 border-background-200/70 rounded-lg text-left hover:border-primary-500 hover:bg-primary-50/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <i className="ri-tools-line text-xl text-primary-700" />
                    </div>
                    <div>
                      <span className="block text-base font-medium text-foreground-800 font-label">Continue as Tradesperson</span>
                      <span className="block text-xs text-foreground-500 mt-0.5">Browse jobs, unlock leads, grow your business</span>
                    </div>
                  </div>
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-foreground-500">
                Not {displayProfile.full_name}?{' '}
                <button onClick={async () => { await supabase.auth.signOut(); setShowRolePicker(false); setPendingProfile(null); }} className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                  Switch account
                </button>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage('');
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}${__BASE_PATH__}reset-password`,
      });
      if (error) {
        setForgotMessage(error.message);
      } else {
        setForgotMessage('Password reset link sent! Check your email inbox.');
      }
    } catch {
      setForgotMessage('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${__BASE_PATH__}dashboard/tradesperson`,
        },
      });
      if (error) {
        setError(friendlyError(error.message));
      }
    } catch {
      setError('Failed to connect with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMessage('');
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail.trim(),
      });
      if (error) {
        setResendMessage(error.message);
      } else {
        setResendMessage('Confirmation email resent! Please check your inbox and Spam/Junk folder.');
      }
    } catch {
      setResendMessage('Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleAcceptPolicies = async () => {
    setPolicyAccepting(true);
    try {
      const targetUserId = user?.id || pendingProfile?.id;
      if (targetUserId) {
        await supabase
          .from('profiles')
          .update({ accepted_policy_version: policyVersion })
          .eq('id', targetUserId);
      }
      // Store in localStorage for guest users
      localStorage.setItem('accepted_policy_version', String(policyVersion));
      setShowPolicyModal(false);

      // If we have a pending profile, proceed to the next step
      if (pendingProfile) {
        const prof = pendingProfile;
        if (prof.is_tradesperson && prof.is_project_owner) {
          setShowRolePicker(true);
          return;
        }
        const mappedRole: ActiveRole = prof.role === 'contractor' ? 'tradesperson'
          : prof.role === 'homeowner' ? 'project_owner'
          : (prof.role as ActiveRole);
        const target = redirectTo || (
          mappedRole === 'tradesperson' ? '/dashboard/tradesperson'
          : mappedRole === 'admin' ? '/bg-ops-7742'
          : '/'
        );
        navigate(target, { replace: true });
      }
    } catch {
      setShowPolicyModal(false);
      // Still proceed — don't block the user on error
      if (pendingProfile) {
        const prof = pendingProfile;
        if (prof.is_tradesperson && prof.is_project_owner) {
          setShowRolePicker(true);
          return;
        }
        const target = redirectTo || '/';
        navigate(target, { replace: true });
      }
    } finally {
      setPolicyAccepting(false);
    }
  };

  // Also show the context-based role picker as a fallback
  if (user && profile && hasDualRoles && !showPolicyModal) {
    const handleRoleSelect = (role: ActiveRole) => {
      setActiveRole(role);
      const target = redirectTo || (role === 'tradesperson' ? '/dashboard/tradesperson' : '/');
      navigate(target, { replace: true });
    };

    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-28 pb-16">
          <div className="w-full max-w-md">
            <div className="bg-white border border-background-200/70 rounded-lg p-8">
              <div className="text-center mb-8">
                <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
                  Welcome, {profile.full_name}
                </h1>
                <p className="text-foreground-600 text-sm">
                  You have access to both profiles. Choose how you&apos;d like to continue.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect('project_owner')}
                  className="w-full p-5 border-2 border-background-200/70 rounded-lg text-left hover:border-primary-500 hover:bg-primary-50/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                      <i className="ri-home-4-line text-xl text-secondary-700" />
                    </div>
                    <div>
                      <span className="block text-base font-medium text-foreground-800 font-label">Continue as Project Owner</span>
                      <span className="block text-xs text-foreground-500 mt-0.5">Post jobs, find tradespeople for your projects</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('tradesperson')}
                  className="w-full p-5 border-2 border-background-200/70 rounded-lg text-left hover:border-primary-500 hover:bg-primary-50/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <i className="ri-tools-line text-xl text-primary-700" />
                    </div>
                    <div>
                      <span className="block text-base font-medium text-foreground-800 font-label">Continue as Tradesperson</span>
                      <span className="block text-xs text-foreground-500 mt-0.5">Browse jobs, unlock leads, grow your business</span>
                    </div>
                  </div>
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-foreground-500">
                Not {profile.full_name}?{' '}
                <button onClick={() => { setActiveRole('project_owner'); supabase.auth.signOut(); }} className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                  Switch account
                </button>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-28 pb-16">
        <div className="w-full max-w-md">
          <div className="bg-white border border-background-200/70 rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-foreground-600 text-sm">
                Sign in to your BuildGuyana.gy account
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-accent-100/80 border border-accent-300/60 rounded-md flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="ri-error-warning-line text-accent-700" />
                </div>
                <div>
                  <p className="text-accent-900 text-sm font-medium">Sign in failed</p>
                  <p className="text-accent-800 text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors"
                  placeholder="Enter your password"
                />
                <div className="flex justify-between mt-1">
                  <button
                    type="button"
                    onClick={() => { setShowResendModal(true); setResendEmail(email); setResendMessage(''); }}
                    className="text-xs text-foreground-500 hover:text-primary-500 cursor-pointer font-label"
                  >
                    Resend confirmation
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotMessage(''); }}
                    className="text-xs text-foreground-500 hover:text-primary-500 cursor-pointer font-label"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-background-200/70" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-foreground-400 font-label">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-background-50 text-foreground-700 text-sm font-label font-medium rounded-md border border-background-200/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
              >
                {googleLoading ? (
                  'Connecting...'
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-foreground-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-background-200/70 rounded-lg p-6 w-full max-w-sm mx-4">
            <h2 className="font-heading text-lg text-foreground-900 mb-1">Reset Password</h2>
            <p className="text-sm text-foreground-600 mb-4">
              Enter your email and we'll send you a password reset link.
            </p>
            <form onSubmit={handleForgotPassword}>
              {forgotMessage && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                  forgotMessage.includes('sent') || forgotMessage.includes('check')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-accent-100/80 border border-accent-300/60 text-accent-900'
                }`}>
                  {forgotMessage}
                </div>
              )}
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors mb-4"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(false); setForgotMessage(''); }}
                  className="flex-1 py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTncModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white border border-background-200/70 rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-background-200/70">
              <h2 className="font-heading text-lg text-foreground-900">Terms & Conditions</h2>
              <p className="text-xs text-foreground-500 mt-0.5">Please read and accept to continue</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap">
                {tncText}
              </div>
            </div>
            <div className="p-4 border-t border-background-200/70 flex justify-end">
              <button
                onClick={() => setShowTncModal(false)}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Update Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white border border-background-200/70 rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-background-200/70">
              <h2 className="font-heading text-lg text-foreground-900">Updated Policies</h2>
              <p className="text-xs text-foreground-500 mt-0.5">
                Our policies have been updated. Please review and accept to continue.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {policyShows.privacy && policyTexts.privacy && (
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-2">Privacy Notice</h3>
                  <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-background-50 p-3 rounded-md border border-background-200/70">
                    {policyTexts.privacy}
                  </div>
                  <button
                    onClick={() => { setShowPolicyModal(false); setShowTncModal(true); }}
                    className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 underline cursor-pointer"
                  >
                    Read our Terms and Conditions
                  </button>
                </div>
              )}
              {policyShows.cookie && policyTexts.cookie && (
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-2">Cookie Policy</h3>
                  <div className="text-sm text-foreground-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-background-50 p-3 rounded-md border border-background-200/70">
                    {policyTexts.cookie}
                  </div>
                </div>
              )}
              {!policyTexts.privacy && !policyTexts.cookie && (
                <p className="text-sm text-foreground-500 text-center py-4">
                  No policy content is currently available. Click Agree to continue.
                </p>
              )}
            </div>
            <div className="p-4 border-t border-background-200/70 flex justify-end">
              <button
                onClick={handleAcceptPolicies}
                disabled={policyAccepting}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {policyAccepting ? 'Accepting...' : 'Agree'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Confirmation Modal */}
      {showResendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-background-200/70 rounded-lg p-6 w-full max-w-sm mx-4">
            <h2 className="font-heading text-lg text-foreground-900 mb-1">Resend Confirmation Email</h2>
            <p className="text-sm text-foreground-600 mb-4">
              Enter your email to receive a new confirmation link.
            </p>
            <form onSubmit={handleResendConfirmation}>
              {resendMessage && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                  resendMessage.includes('resent') || resendMessage.includes('check')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-accent-100/80 border border-accent-300/60 text-accent-900'
                }`}>
                  {resendMessage}
                </div>
              )}
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition-colors mb-4"
              />
              <p className="text-xs text-foreground-500 mb-4 leading-relaxed">
                If you don't receive the email, please check your Spam/Junk folder. Cloudflare or email providers sometimes delay these messages. If it still doesn't arrive, please contact support.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowResendModal(false); setResendMessage(''); }}
                  className="flex-1 py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resendLoading || !resendEmail.trim()}
                  className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {resendLoading ? 'Sending...' : 'Resend Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
