import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  role: string;
  full_name: string;
  phone: string | null;
  region: string;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  deleted_at: string | null;
  is_tradesperson: boolean;
  is_project_owner: boolean;
  accepted_policy_version: number | null;
  reliable_payer_points: number | null;
  trustworthy_pro_points: number | null;
}

export interface ContractorProfile {
  id: string;
  profile_id: string;
  category: string;
  categories: string[] | null;
  secondary_trades: string[] | null;
  region: string;
  bio: string | null;
  years_experience: number | null;
  verified: boolean;
  verification_status: string;
  verification_doc_url: string | null;
  doc_business_reg: string | null;
  doc_gra: string | null;
  doc_nis: string | null;
  doc_profile: string | null;
  doc_id_card: string | null;
  doc_passport: string | null;
  id_verification_status: string | null;
  trade_license_status: string | null;
  trade_license_number: string | null;
  trade_license_doc_url: string | null;
  portfolio_images: string[] | null;
  facebook_page_url: string | null;
  rating: number | null;
  review_count: number | null;
  badge_id: string | null;
  tier: string | null;
  tier_expires_at: string | null;
  total_leads_unlocked: number | null;
  is_business: boolean | null;
  business_name: string | null;
  is_verified_business: boolean | null;
  business_type: string | null;
  director_ids: string[] | null;
  payment_method_details: string | null;
  payout_details: string | null;
  trial_started_at: string | null;
  trial_shortlists_used: number | null;
  materials_supplied: string[] | null;
  created_at: string;
}

export type ActiveRole = 'tradesperson' | 'project_owner' | 'admin';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  contractorProfile: ContractorProfile | null;
  activeRole: ActiveRole | null;
  hasDualRoles: boolean;
  isAdmin: boolean;
  loading: boolean;
  isDeleted: boolean;
  needsProfileCompletion: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  recoverAccount: () => Promise<void>;
  setActiveRole: (role: ActiveRole) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@buildguyana.gy';

function determineRole(profileData: Profile | null, userEmail: string | undefined): ActiveRole | null {
  if (!profileData) return null;
  // Admin check uses auth.users email — NOT profiles table
  if (userEmail === ADMIN_EMAIL) return 'admin';

  const hasTrade = !!profileData.is_tradesperson;
  const hasOwner = !!profileData.is_project_owner;

  if (hasTrade && !hasOwner) return 'tradesperson';
  if (!hasTrade && hasOwner) return 'project_owner';

  // Dual roles — default to whatever the legacy role column says
  const mapped = profileData.role === 'contractor'
    ? 'tradesperson'
    : profileData.role === 'homeowner'
      ? 'project_owner'
      : profileData.role;

  if (mapped === 'tradesperson' || mapped === 'project_owner') return mapped;

  // Fallback
  if (hasTrade) return 'tradesperson';
  return 'project_owner';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
  const [activeRole, setActiveRoleState] = useState<ActiveRole | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  // Resilient fetchProfile — never throws, always sets loading false
  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userMetadata?: Record<string, unknown>) => {
    try {
      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileResult.error || !profileResult.data) {
        console.error('[Auth] Profile fetch error:', profileResult?.error);
        setProfile(null);
        setContractorProfile(null);
        // Still determine role from email alone (admin check)
        setActiveRoleState(userEmail === ADMIN_EMAIL ? 'admin' : null);
        return;
      }

      const prof = profileResult.data as Profile;

      // Map legacy role names
      const mappedRole = prof.role === 'contractor' ? 'tradesperson'
        : prof.role === 'homeowner' ? 'project_owner'
        : prof.role;

      // Fallback full_name for invited users (missing metadata / "New User")
      let resolvedFullName = prof.full_name;
      if (!resolvedFullName || resolvedFullName === 'New User') {
        const metaName = typeof userMetadata?.full_name === 'string'
          ? userMetadata.full_name
          : typeof userMetadata?.name === 'string'
            ? userMetadata.name
            : '';
        if (metaName && metaName !== 'New User') resolvedFullName = metaName;
      }

      const resolvedProfile: Profile = { ...prof, role: mappedRole, full_name: resolvedFullName };
      setProfile(resolvedProfile);

      // Use the passed-in userEmail (from session) — avoids extra auth.getUser() call
      const resolvedRole = determineRole(resolvedProfile, userEmail);
      setActiveRoleState(resolvedRole);

      // Fetch contractor profile if user has tradesperson capability
      if (resolvedProfile.is_tradesperson) {
        const contractorResult = await supabase
          .from('contractors')
          .select('*')
          .eq('profile_id', userId)
          .maybeSingle();

        if (contractorResult.error) {
          console.error('[Auth] Contractor fetch error:', contractorResult.error);
        }
        setContractorProfile(contractorResult.data as ContractorProfile | null);
      } else {
        setContractorProfile(null);
      }
    } catch (err) {
      console.error('[Auth] Unexpected profile fetch error:', err);
      setProfile(null);
      setContractorProfile(null);
      setActiveRoleState(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  }, [user, fetchProfile]);

  // Pure client-side role switch — no DB gatekeeping, no forced re-fetches.
  const setActiveRole = useCallback((role: ActiveRole) => {
    if (role === 'admin') {
      setActiveRoleState('admin');
      return;
    }
    // Safely check capabilities without throwing if profile is null
    if (!profile) {
      console.warn('[Auth] Cannot switch role: profile not loaded yet');
      return;
    }
    if (role === 'tradesperson' && !profile.is_tradesperson) {
      console.warn('[Auth] User is not registered as a tradesperson');
      return;
    }
    if (role === 'project_owner' && !profile.is_project_owner) {
      console.warn('[Auth] User is not registered as a project owner');
      return;
    }
    setActiveRoleState(role);
  }, [profile]);

  useEffect(() => {
    supabase.auth.getSession().then(async (result) => {
      const currentSession = result?.data?.session ?? null;
      const currentUserId = currentSession?.user?.id ?? null;
      const currentUserEmail = currentSession?.user?.email;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentUserId) {
        lastUserIdRef.current = currentUserId;
        await fetchProfile(currentUserId, currentUserEmail, currentSession?.user?.user_metadata);
      }
      initialLoadDoneRef.current = true;
      setLoading(false);
    }).catch(() => {
      initialLoadDoneRef.current = true;
      setLoading(false);
    });

    const authListener = supabase.auth.onAuthStateChange((_event, newSession) => {
      const newUserId = newSession?.user?.id ?? null;

      if (initialLoadDoneRef.current && newUserId === lastUserIdRef.current) {
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        lastUserIdRef.current = newSession.user.id;
        setLoading(true);
        setTimeout(() => {
          fetchProfile(newSession.user.id, newSession.user.email, newSession.user.user_metadata).finally(() => setLoading(false));
        }, 150);
      } else {
        lastUserIdRef.current = null;
        setProfile(null);
        setContractorProfile(null);
        setActiveRoleState(null);
        setLoading(false);
      }
    });

    const subscription = authListener?.data?.subscription;

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setContractorProfile(null);
    setActiveRoleState(null);
  }, []);

  const recoverAccount = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: null })
      .eq('id', user.id);
    if (!error) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  }, [user, fetchProfile]);

  // isAdmin always checks user?.email (from auth.users) — never from profiles table
  const hasDualRoles = !!profile?.is_tradesperson && !!profile?.is_project_owner;
  const isAdmin = user?.email === ADMIN_EMAIL;
  const isDeleted = !!profile?.deleted_at;
  const needsProfileCompletion = !!profile && (
    !profile.full_name ||
    profile.full_name === 'New User' ||
    profile.full_name === 'Deleted User' ||
    !profile.region ||
    profile.region === 'N/A'
  );

  return (
    <AuthContext.Provider value={{
      user, session, profile, contractorProfile, activeRole, hasDualRoles: !!hasDualRoles,
      isAdmin, loading, signOut, refreshProfile, setActiveRole,
      isDeleted, needsProfileCompletion, recoverAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}