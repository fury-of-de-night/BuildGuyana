import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useDemo } from '@/contexts/DemoModeContext';
import { useAuth } from '@/contexts/AuthContext';

// UUID v4 regex — blocks non-UUID values before they hit Supabase
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  job_title: string | null;
  reviewer: { id: string; full_name: string };
}

interface ContractorInfo {
  id: string;
  full_name: string;
  category: string;
  region: string;
}

export default function TradespersonReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const { isDemo } = useDemo();
  const { user } = useAuth();
  const [contractor, setContractor] = useState<ContractorInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id || !UUID_RE.test(id)) {
      setLoading(false);
      setError('Tradesperson not found.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Fetch contractor stats from view
      const { data: statsData, error: statsError } = await supabase
        .from('contractor_stats')
        .select('average_rating, total_reviews')
        .eq('contractor_id', id)
        .maybeSingle();

      if (statsError) throw statsError;

      setAverageRating(parseFloat(statsData?.average_rating) || 0);
      setTotalReviews(statsData?.total_reviews || 0);

      // Fetch contractor info with profile
      const { data: contractorData, error: cError } = await supabase
        .from('contractors')
        .select('id, profile_id, category, region')
        .eq('id', id)
        .maybeSingle();

      if (cError) throw cError;
      if (!contractorData) {
        setError('Tradesperson not found.');
        return;
      }

      let fullName = 'Tradesperson';
      if (contractorData.profile_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', contractorData.profile_id)
          .maybeSingle();
        if (profileData) {
          fullName = profileData.full_name;
        }
      }

      setContractor({
        id: contractorData.id,
        full_name: fullName,
        category: contractorData.category || 'General',
        region: contractorData.region || 'Guyana',
      });

      // Fetch reviews
      const { data: reviewsData, error: rError } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          reviewer:reviewer_id (id, full_name),
          job:job_id (title)
        `)
        .eq('contractor_id', id)
        .order('created_at', { ascending: false });

      if (rError) throw rError;

      const mapped: Review[] = (reviewsData || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        job_title: r.job?.title || null,
        reviewer: {
          id: r.reviewer?.id || '',
          full_name: r.reviewer?.full_name || 'Anonymous',
        },
      }));

      setReviews(mapped);
    } catch (err: unknown) {
      console.error('Failed to load reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className="w-3.5 h-3.5 flex items-center justify-center">
        <i className={`text-sm ${i < rating ? 'ri-star-fill text-amber-400' : 'ri-star-line text-foreground-300'}`} />
      </span>
    ));
  };

  // A review can only be edited/deleted by its author, within 72 hours of creation.
  const canEditReview = (review: Review) => {
    if (!user) return false;
    if (review.reviewer.id !== user.id) return false;
    const createdMs = new Date(review.created_at).getTime();
    return Date.now() - createdMs < 72 * 60 * 60 * 1000;
  };

  const openEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    if (editRating === 0) {
      setEditError('Please select a star rating.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const { error: updateErr } = await supabase
        .from('reviews')
        .update({ rating: editRating, comment: editComment.trim() || null })
        .eq('id', editingReview.id);
      if (updateErr) throw updateErr;
      setEditingReview(null);
      await fetchData();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update review.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      const { error: delErr } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (delErr) throw delErr;
      await fetchData();
    } catch (err: unknown) {
      console.error('Failed to delete review:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className={`flex-1 px-4 md:px-6 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'} pb-12`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to={`/contractors/${id}`}
              className="inline-flex items-center gap-1.5 text-sm text-foreground-500 hover:text-foreground-700 mb-4 cursor-pointer"
            >
              <i className="ri-arrow-left-line" />
              Back to profile
            </Link>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-foreground-600 mb-4">{error}</p>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-primary-500 text-background-50 text-sm font-label font-medium rounded-md cursor-pointer whitespace-nowrap"
                >
                  Try Again
                </button>
              </div>
            ) : contractor ? (
              <>
                <div className="mb-6">
                  <h1 className="font-heading text-2xl md:text-3xl text-foreground-900">
                    Reviews for {contractor.full_name}
                  </h1>
                  <p className="text-foreground-600 text-sm mt-1">
                    {contractor.category} &middot; {contractor.region}
                  </p>
                </div>

                {/* Rating Summary */}
                <div className="bg-white border border-background-200/70 rounded-lg p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                  <div className="text-center sm:text-left">
                    <p className="text-4xl font-bold text-foreground-900 font-heading">{averageRating.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {renderStars(Math.round(averageRating))}
                    </div>
                    <p className="text-xs text-foreground-500 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length;
                      const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-foreground-600 w-8 text-right">{star}★</span>
                          <div className="flex-1 h-2 bg-background-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-foreground-400 w-6">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-background-200/70 rounded-lg">
                    <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                      <i className="ri-chat-smile-2-line text-3xl text-foreground-400" />
                    </div>
                    <p className="text-foreground-600 text-sm">No reviews yet for this tradesperson.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="bg-white border border-background-200/70 rounded-lg p-4 md:p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="font-label text-xs font-bold text-primary-600">
                                {r.reviewer.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-label text-sm font-semibold text-foreground-900">{r.reviewer.full_name}</p>
                              <p className="text-xs text-foreground-500">{formatDate(r.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canEditReview(r) && (
                              <>
                                <button
                                  onClick={() => openEdit(r)}
                                  className="text-xs text-primary-600 hover:text-primary-700 font-label cursor-pointer whitespace-nowrap"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(r.id)}
                                  disabled={deletingId === r.id}
                                  className="text-xs text-accent-600 hover:text-accent-700 font-label cursor-pointer whitespace-nowrap disabled:opacity-50"
                                >
                                  {deletingId === r.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </>
                            )}
                            <div className="flex items-center gap-0.5">
                              {renderStars(r.rating)}
                            </div>
                          </div>
                        </div>
                        {r.job_title && (
                          <p className="text-xs text-foreground-500 mb-2">
                            <i className="ri-briefcase-line mr-1" />
                            Job: {r.job_title}
                          </p>
                        )}
                        {r.comment && (
                          <p className="text-sm text-foreground-700 leading-relaxed">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-background-200/70 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="font-heading text-lg text-foreground-900 mb-1">Edit Review</h2>
            <p className="text-sm text-foreground-600 mb-4">Update your rating and comment.</p>
            {editError && (
              <div className="mb-4 p-3 rounded-md text-sm bg-accent-100/80 border border-accent-300/60 text-accent-900">
                {editError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditRating(s)}
                    className="w-8 h-8 flex items-center justify-center cursor-pointer"
                  >
                    <i className={`text-xl ${s <= editRating ? 'ri-star-fill text-amber-400' : 'ri-star-line text-foreground-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">Comment</label>
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 resize-vertical"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditingReview(null)}
                className="flex-1 py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving || editRating === 0}
                className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}