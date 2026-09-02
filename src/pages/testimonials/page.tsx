import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Testimonial {
  id: string;
  user_id: string | null;
  name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function TestimonialsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTestimonials(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (rating === 0) {
      setSubmitStatus({ type: 'error', message: 'Please select a star rating.' });
      return;
    }
    if (!name.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please enter your name.' });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const honeypotVal = (formData.get('website_alt') as string || '').trim();
    if (honeypotVal) {
      setSubmitStatus({ type: 'success', message: 'Thank you for your review!' });
      return;
    }

    if (!user) {
      setSubmitStatus({ type: 'error', message: 'Please log in to leave a review.' });
      return;
    }

    try {
      setSubmitting(true);
      const { error: insertError } = await supabase
        .from('testimonials')
        .insert({
          user_id: user.id,
          name: name.trim(),
          rating,
          comment: comment.trim() || null,
          is_mock_data: false,
        });

      if (insertError) throw insertError;

      setSubmitStatus({ type: 'success', message: 'Thank you for sharing your experience! Your review is now live.' });
      setRating(0);
      setComment('');
      fetchTestimonials();
    } catch (err: unknown) {
      setSubmitStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const filled = interactive
        ? starValue <= (hoverRating || rating)
        : starValue <= count;

      if (interactive) {
        return (
          <button
            key={i}
            type="button"
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i
              className={`text-xl ${filled ? 'ri-star-fill text-amber-400' : 'ri-star-line text-foreground-300'}`}
            />
          </button>
        );
      }

      return (
        <span key={i} className="w-4 h-4 flex items-center justify-center">
          <i className={`text-sm ${filled ? 'ri-star-fill text-amber-400' : 'ri-star-line text-foreground-300'}`} />
        </span>
      );
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const avgRating = testimonials.length
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : '0.0';

  return (
    <>
      <main>
        {/* Back to Home */}
        <div className="w-full px-4 md:px-8 lg:px-12 py-3 bg-background-50 border-b border-background-200/70">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm text-foreground-600 hover:text-primary-500 font-label transition-colors cursor-pointer"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-left-line" />
            </div>
            Back to Home
          </button>
        </div>

        {/* Hero */}
        <section className="relative bg-background-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background-900 via-background-800 to-background-900" />
          <div className="relative w-full px-4 md:px-8 lg:px-12 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-background-50">
                What People Say About BuildGuyana.gy
              </h1>
              <p className="mt-4 text-sm md:text-base text-background-300 max-w-xl mx-auto">
                Real stories from homeowners and contractors across Guyana. Got a story? We'd love to hear it.
              </p>
              {testimonials.length > 0 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1">
                    {renderStars(Math.round(Number(avgRating)))}
                  </div>
                  <span className="text-background-50 font-heading font-bold text-lg">{avgRating}</span>
                  <span className="text-background-400 text-sm">({testimonials.length} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Review Form */}
        <section className="py-12 md:py-16 bg-background-50">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="max-w-2xl mx-auto">
              <div className="bg-background-100 rounded-2xl p-6 md:p-10">
                <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 text-center">
                  Share Your Experience
                </h2>
                <p className="mt-2 text-sm text-foreground-600 text-center">
                  Your feedback helps us improve and helps others find great tradespeople.
                </p>

                {!user ? (
                  <div className="mt-8 text-center">
                    <p className="text-sm text-foreground-600 mb-4">
                      Please log in or create an account to leave a review.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        to="/login"
                        className="px-5 py-2.5 rounded-md font-label text-sm font-medium bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors whitespace-nowrap"
                      >
                        Log In
                      </Link>
                      <Link
                        to="/register"
                        className="px-5 py-2.5 rounded-md font-label text-sm font-medium border border-background-200/70 text-foreground-700 hover:border-primary-300/60 hover:text-primary-500 transition-colors whitespace-nowrap"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    {/* Honeypot */}
                    <input
                      type="text"
                      name="website_alt"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      readOnly
                      className="absolute opacity-0 pointer-events-none"
                    />

                    {/* Name */}
                    <div>
                      <label htmlFor="review-name" className="block font-label text-sm font-medium text-foreground-700 mb-1.5">
                        Your Name
                      </label>
                      <input
                        id="review-name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={60}
                        className="w-full px-4 py-2.5 rounded-lg bg-background-50 border border-background-200/70 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-300/60 focus:border-primary-300/60 transition-all"
                        placeholder="Enter your name"
                      />
                    </div>

                    {/* Star Rating */}
                    <div>
                      <span className="block font-label text-sm font-medium text-foreground-700 mb-1.5">
                        Your Rating
                      </span>
                      <div className="flex items-center gap-1">
                        {renderStars(0, true)}
                        {rating > 0 && (
                          <span className="ml-2 text-sm text-foreground-600 font-label">
                            {rating}/5
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label htmlFor="review-comment" className="block font-label text-sm font-medium text-foreground-700 mb-1.5">
                        Your Review <span className="text-foreground-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="review-comment"
                        name="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={500}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-lg bg-background-50 border border-background-200/70 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-300/60 focus:border-primary-300/60 transition-all resize-none"
                        placeholder="Tell us about your experience with BuildGuyana.gy..."
                      />
                      <p className="mt-1 text-xs text-foreground-400 text-right">
                        {comment.length}/500
                      </p>
                    </div>

                    {/* Status */}
                    {submitStatus && (
                      <div className={`px-4 py-3 rounded-lg text-sm font-label ${
                        submitStatus.type === 'success'
                          ? 'bg-green-50 text-green-700 border border-green-200/70'
                          : 'bg-red-50 text-red-700 border border-red-200/70'
                      }`}>
                        {submitStatus.message}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-6 py-3 rounded-lg font-label text-sm font-semibold bg-primary-500 text-background-50 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 flex items-center justify-center">
                            <i className="ri-loader-4-line animate-spin" />
                          </div>
                          Submitting...
                        </span>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-12 md:py-16 bg-background-100">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 text-center mb-8">
                All Reviews
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin text-2xl text-primary-500" />
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-sm text-foreground-600 mb-4">{error}</p>
                  <button
                    onClick={fetchTestimonials}
                    className="px-4 py-2 rounded-md font-label text-sm font-medium bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-chat-smile-2-line text-4xl text-foreground-300" />
                  </div>
                  <p className="text-sm text-foreground-600">No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="bg-background-50 rounded-xl p-5 md:p-6 border border-background-200/70"
                    >
                      <div className="flex items-center gap-1 mb-3">
                        {renderStars(t.rating)}
                      </div>
                      {t.comment && (
                        <p className="text-sm text-foreground-700 leading-relaxed">
                          "{t.comment}"
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="font-label text-sm font-semibold text-foreground-900">
                            {t.name}
                          </p>
                          <p className="font-label text-xs text-foreground-500 mt-0.5">
                            {formatDate(t.created_at)}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="font-label text-sm font-bold text-primary-600">
                            {t.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* CTA */}
      <section className="py-14 md:py-20 bg-background-900">
        <div className="w-full px-4 md:px-8 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-background-50">
              Ready to Find Your Tradesperson?
            </h2>
            <p className="mt-3 text-sm text-background-300">
              Join thousands of homeowners across Guyana who've found trusted contractors through BuildGuyana.gy.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/post-job"
                className="px-6 py-3 rounded-lg font-label text-sm font-semibold bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                Post a Job — It's Free
              </Link>
              <Link
                to="/contractors"
                className="px-6 py-3 rounded-lg font-label text-sm font-medium border border-background-50/20 text-background-50 hover:border-background-50/40 transition-colors whitespace-nowrap"
              >
                Browse Contractors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}