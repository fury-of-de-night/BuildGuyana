import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useDemo } from '@/contexts/DemoModeContext';

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function TestimonialsSection() {
  const { isDemo } = useDemo();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideMock, setHideMock] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchTestimonials = async () => {
      try {
        // Read the "Hide Mock Testimonials" admin toggle.
        const { data: settingData } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'hide_mock_testimonials')
          .maybeSingle();
        const hideMockEnabled = settingData?.value === 'true';

        let query = supabase
          .from('testimonials')
          .select('id, name, rating, comment, created_at')
          .order('created_at', { ascending: false })
          .limit(6);

        // When hiding mock data, show only real testimonials (is_mock_data = false).
        // Otherwise keep the existing behavior (mock in demo, real in production).
        query = hideMockEnabled
          ? query.eq('is_mock_data', false)
          : query.eq('is_mock_data', isDemo);

        const { data } = await query;

        if (!cancelled) {
          setHideMock(hideMockEnabled);
          setTestimonials((data || []) as Testimonial[]);
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) setTestimonials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTestimonials();

    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  if (loading) {
    return null;
  }

  // When hiding mock data and no real testimonials exist, show a "Coming Soon" placeholder.
  if ((!testimonials || testimonials.length === 0) && hideMock) {
    return (
      <section className="py-14 md:py-20 bg-background-100">
        <div className="w-full px-4 md:px-8 lg:px-12">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground-900">
              What Homeowners Say
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-background-50 border border-background-200/70 rounded-2xl p-10 md:p-16 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <i className="ri-chat-smile-2-line text-3xl text-foreground-400" />
              </div>
              <p className="font-heading text-lg md:text-xl text-foreground-900">Coming Soon</p>
              <p className="mt-2 text-sm md:text-base text-foreground-600 max-w-md mx-auto">
                Real homeowner reviews are on the way. Check back soon to hear from people across Guyana.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Hide the section entirely when there are no testimonials to show
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const active = testimonials[activeIndex] || testimonials[0];

  return (
    <section className="py-14 md:py-20 bg-background-100">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground-900">
            What Homeowners Say
          </h2>
          <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-xl mx-auto">
            Real stories from real people across Guyana who found their perfect tradesperson on BuildGuyana.gy
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-foreground-900 rounded-2xl overflow-hidden">
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <div className="w-10 h-10 flex items-center justify-center mb-4">
                <i className="ri-double-quotes-l text-3xl text-primary-400" />
              </div>

              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="w-4 h-4 flex items-center justify-center">
                    <i className={`${i < active.rating ? 'ri-star-fill text-amber-400' : 'ri-star-line text-background-500'} text-sm`} />
                  </div>
                ))}
              </div>

              <p className="font-heading text-base md:text-lg lg:text-xl text-background-50 leading-relaxed italic">
                "{active.comment || ''}"
              </p>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="font-label font-semibold text-sm text-background-50">
                    {active.name}
                  </p>
                  <p className="font-label text-xs text-background-400 mt-0.5">
                    {new Date(active.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <Link
                  to="/testimonials"
                  className="font-label text-xs text-primary-400 hover:text-primary-300 transition-colors whitespace-nowrap"
                >
                  Read all reviews &rarr;
                </Link>
              </div>
            </div>
          </div>

          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    index === activeIndex
                      ? 'w-8 bg-primary-500'
                      : 'w-2 bg-background-300 hover:bg-background-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}