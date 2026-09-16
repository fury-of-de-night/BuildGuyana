import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { AuthGuard } from '@/components/feature/AuthGuard';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

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

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  );
}

function AdminDashboard() {
  const { profile, user, loading } = useAuth();
  const { isDemo } = useDemo();
  const [pendingContractors, setPendingContractors] = useState<PendingContractor[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hardcode fury65shots@gmail.com as the admin — checks email directly, not the DB role column
  const isAdmin = user?.email === process.env.ADMIN_EMAIL || 'admin@buildguyana.gy';

  const fetchPending = useCallback(async () => {
    setLoadingData(true);
    try {
      const contractorResult = await supabase
        .from('contractors')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (contractorResult.error) throw contractorResult.error;
      if (!contractorResult.data || contractorResult.data.length === 0) {
        setPendingContractors([]);
        return;
      }

      const profileIds = contractorResult.data.map((c) => c.profile_id);
      const profileResult = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', profileIds);

      if (profileResult.error) throw profileResult.error;

      const profileMap = new Map(profileResult.data?.map((p) => [p.id, p]) || []);

      const merged = contractorResult.data.map((c) => ({
        ...c,
        full_name: profileMap.get(c.profile_id)?.full_name || 'Unknown',
        phone: profileMap.get(c.profile_id)?.phone || null,
      }));

      setPendingContractors(merged);
    } catch (err) {
      console.error('Failed to fetch pending verifications:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (contractor: PendingContractor) => {
    setActionLoading(contractor.id);
    setFeedback(null);

    try {
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
      setPendingContractors((prev) => prev.filter((c) => c.id !== contractor.id));
    } catch (err) {
      console.error('Approve error:', err);
      setFeedback({ type: 'error', message: 'Failed to approve tradesperson. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (contractor: PendingContractor) => {
    setActionLoading(contractor.id);
    setFeedback(null);

    try {
      const { error: updateError } = await supabase
        .from('contractors')
        .update({
          verification_status: 'rejected',
          verified: false,
        })
        .eq('id', contractor.id);

      if (updateError) throw updateError;

      setFeedback({ type: 'success', message: `${contractor.full_name} has been rejected.` });
      setPendingContractors((prev) => prev.filter((c) => c.id !== contractor.id));
    } catch (err) {
      console.error('Reject error:', err);
      setFeedback({ type: 'error', message: 'Failed to reject contractor. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Show loading while AuthContext is still resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-foreground-600 text-sm font-label">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Hardcoded admin email check — bypasses DB role column entirely
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background-50">
        <Navbar />
        <main className={`flex-1 flex items-center justify-center px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-8`}>
          <div className="bg-white border border-background-200/70 rounded-lg p-8 w-full max-w-md mx-auto text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent-100 flex items-center justify-center">
              <i className="ri-forbid-line text-2xl text-accent-700" />
            </div>
            <h1 className="font-heading text-lg text-foreground-900 mb-2">Access Denied</h1>
            <p className="text-sm text-foreground-600 mb-2">
              This admin dashboard is restricted to the platform administrator.
            </p>
            <p className="text-xs text-foreground-500 mb-6">
              Signed in as: {user?.email || 'Unknown'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-home-4-line" />
              </div>
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className={`flex-1 px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-8`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
              Admin Dashboard
            </h1>
            <p className="text-foreground-600 text-sm mt-1">
              Welcome, {profile?.full_name || user?.email}. Manage tradesperson verification requests.
            </p>
          </div>

          {feedback && (
            <div className={`mb-6 p-4 rounded-md border ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-accent-100/80 border-accent-300/60'
            }`}>
              <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-accent-900'}`}>
                {feedback.message}
              </p>
            </div>
          )}

          <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6 border-b border-background-200/70">
              <h2 className="font-heading text-lg text-foreground-900">
                Pending Verifications
              </h2>
              <p className="text-sm text-foreground-600 mt-1">
                {pendingContractors.length} tradesperson{pendingContractors.length !== 1 ? 's' : ''} awaiting approval
              </p>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pendingContractors.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                  <i className="ri-check-double-line text-3xl text-foreground-400" />
                </div>
                <p className="text-foreground-600 text-sm font-label">All caught up!</p>
                <p className="text-foreground-500 text-xs mt-1">No pending verification requests.</p>
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
                    {pendingContractors.map((c) => (
                      <tr key={c.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-foreground-800 text-xs font-medium">{c.full_name}</p>
                          <p className="text-foreground-500 text-xs">{c.phone || 'No phone'}</p>
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
                              <div className="w-3 h-3 flex items-center justify-center">
                                <i className="ri-file-line" />
                              </div>
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-foreground-400">No file</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}