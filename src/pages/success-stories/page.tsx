import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoModeContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

interface Story {
  id: string;
  name: string;
  location: string;
  description: string;
  before_image_url: string | null;
  after_image_url: string | null;
  rating: number;
  testimonial_comment: string | null;
  created_at: string;
}

const MOCK_STORIES: Story[] = [
  {
    id: 'mock-story-1',
    name: 'Full Home Renovation — Campbellville',
    location: 'Georgetown, Region 4',
    description: 'A dated 1970s timber home was completely transformed into a modern two-storey family residence, including a new roof, electrical rewiring, and full interior finishing.',
    before_image_url: 'https://readdy.ai/api/search-image?query=Dilapidated%20old%20Caribbean%20timber%20house%20with%20faded%20peeling%20paint%20weathered%20walls%20overgrown%20yard%20and%20rusted%20zinc%20roof%2C%20overcast%20daylight%2C%20documentary%20before%20renovation%20photography%20with%20muted%20earthy%20tones%20and%20worn%20aged%20atmosphere&width=800&height=600&seq=success-before-1&orientation=landscape',
    after_image_url: 'https://readdy.ai/api/search-image?query=Beautifully%20renovated%20modern%20Caribbean%20family%20home%20with%20fresh%20cream%20painted%20exterior%20terracotta%20roof%20trim%20neat%20tropical%20garden%20and%20palm%20trees%2C%20warm%20golden%20hour%20sunlight%2C%20professional%20architectural%20photography%20with%20bright%20inviting%20atmosphere&width=800&height=600&seq=success-after-1&orientation=landscape',
    rating: 5,
    testimonial_comment: 'The team completely transformed our family home. They finished on time and the quality is outstanding.',
    created_at: '2026-05-18T00:00:00Z',
  },
  {
    id: 'mock-story-2',
    name: 'Concrete Driveway & Patio — New Amsterdam',
    location: 'New Amsterdam, Region 6',
    description: 'Over 1,300 square feet of mud yard was excavated, formed, and poured into a smooth brushed concrete driveway and rear patio with proper drainage.',
    before_image_url: 'https://readdy.ai/api/search-image?query=Muddy%20uneven%20dirt%20yard%20with%20puddles%20and%20grass%20patches%20at%20a%20Caribbean%20home%20entrance%2C%20overcast%20rainy%20daylight%2C%20documentary%20before%20construction%20photography%20with%20dull%20muddy%20earthy%20tones%20and%20unfinished%20rough%20atmosphere&width=800&height=600&seq=success-before-2&orientation=landscape',
    after_image_url: 'https://readdy.ai/api/search-image?query=Smooth%20freshly%20poured%20concrete%20driveway%20and%20patio%20at%20a%20Caribbean%20home%20with%20brushed%20finish%20clean%20edges%20and%20tropical%20garden%20landscaping%2C%20warm%20golden%20hour%20sunlight%2C%20professional%20architectural%20photography%20with%20crisp%20satisfying%20finish&width=800&height=600&seq=success-after-2&orientation=landscape',
    rating: 5,
    testimonial_comment: 'What was once a muddy mess is now a beautiful driveway. The crew was professional from quote to cleanup.',
    created_at: '2026-06-02T00:00:00Z',
  },
  {
    id: 'mock-story-3',
    name: 'Roof Replacement — Rosignol',
    location: 'Rosignol, Region 5',
    description: 'A leaking zinc-sheet roof on a three-bedroom home was fully replaced with new galvanized sheets, ridge caps, and sealed flashing ahead of the rainy season.',
    before_image_url: 'https://readdy.ai/api/search-image?query=Old%20rusted%20leaking%20zinc%20sheet%20roof%20on%20a%20Caribbean%20house%20with%20visible%20holes%20stains%20and%20bent%20panels%2C%20overcast%20sky%2C%20documentary%20before%20roofing%20photography%20with%20worn%20deteriorated%20weathered%20atmosphere&width=800&height=600&seq=success-before-3&orientation=landscape',
    after_image_url: 'https://readdy.ai/api/search-image?query=Newly%20installed%20bright%20galvanized%20zinc%20sheet%20roof%20on%20a%20Caribbean%20house%20with%20neat%20ridge%20cap%20and%20clean%20sealed%20flashing%2C%20blue%20sky%20background%2C%20warm%20tropical%20sunlight%2C%20professional%20roofing%20photography%20with%20crisp%20clean%20finish&width=800&height=600&seq=success-after-3&orientation=landscape',
    rating: 5,
    testimonial_comment: 'Zero leaks since the new roof went up. They even finished a day early.',
    created_at: '2026-04-21T00:00:00Z',
  },
  {
    id: 'mock-story-4',
    name: 'Custom Kitchen Remodel — Vreed-en-Hoop',
    location: 'Vreed-en-Hoop, Region 3',
    description: 'A cramped outdated kitchen was gutted and rebuilt with custom hardwood cabinetry, ceramic tile backsplash, new countertops, and modern plumbing fixtures.',
    before_image_url: 'https://readdy.ai/api/search-image?query=Outdated%20cramped%20Caribbean%20kitchen%20with%20worn%20stained%20cabinets%20chipped%20countertop%20old%20appliances%20and%20faded%20walls%2C%20dim%20natural%20light%2C%20documentary%20before%20renovation%20photography%20with%20tired%20dated%20atmosphere&width=800&height=600&seq=success-before-4&orientation=landscape',
    after_image_url: 'https://readdy.ai/api/search-image?query=Modern%20renovated%20Caribbean%20kitchen%20with%20custom%20hardwood%20cabinets%20granite%20countertop%20ceramic%20tile%20backsplash%20and%20new%20stainless%20fixtures%2C%20warm%20natural%20light%20through%20window%2C%20professional%20interior%20photography%20with%20bright%20inviting%20atmosphere&width=800&height=600&seq=success-after-4&orientation=landscape',
    rating: 4,
    testimonial_comment: 'The attention to detail was impressive. Our kitchen now feels like it belongs in a magazine.',
    created_at: '2026-03-12T00:00:00Z',
  },
  {
    id: 'mock-story-5',
    name: 'Chain-Link Fence — Corentyne',
    location: 'Corentyne, Region 6',
    description: 'A 200-foot perimeter was enclosed with a 6-foot chain-link fence, one double gate, and a pedestrian gate with concrete posts for long-term durability.',
    before_image_url: 'https://readdy.ai/api/search-image?query=Open%20unenclosed%20grassy%20Caribbean%20property%20boundary%20with%20no%20fence%20and%20scattered%20vegetation%2C%20overcast%20daylight%2C%20documentary%20before%20fencing%20photography%20with%20empty%20exposed%20unfinished%20atmosphere&width=800&height=600&seq=success-before-5&orientation=landscape',
    after_image_url: 'https://readdy.ai/api/search-image?query=Newly%20installed%20chain-link%20fence%20with%20concrete%20posts%20and%20steel%20gate%20enclosing%20a%20Caribbean%20property%2C%20neatly%20tensioned%20mesh%2C%20tropical%20garden%20background%2C%20warm%20golden%20hour%20sunlight%2C%20professional%20installation%20photography%20with%20secure%20finished%20look&width=800&height=600&seq=success-after-5&orientation=landscape',
    rating: 5,
    testimonial_comment: 'Straight, strong, and exactly what we wanted. The gate works perfectly.',
    created_at: '2026-02-08T00:00:00Z',
  },
  {
    id: 'mock-story-6',
    name: 'Land Clearing & Landscaping — Linden',
    location: 'Linden, Region 10',
    description: 'Three acres of heavy bush was cleared, graded, and landscaped for a new residential plot, including drainage channels and a clean building pad.',
    before_image_url: 'https://readdy.ai/api/search-image?query=Thick%20overgrown%20tropical%20bush%20lot%20with%20dense%20vegetation%20medium%20trees%20and%20uneven%20red%20clay%20ground%2C%20overcast%20daylight%2C%20documentary%20before%20land%20clearing%20photography%20with%20wild%20untamed%20dense%20atmosphere&width=800&height=600&seq=success-before-6&orientation=landscape',
    after_image_url: 'https://readdy.ai/api/search-image?query=Cleared%20and%20graded%20tropical%20residential%20plot%20with%20smooth%20red%20earth%20drainage%20channels%20and%20neatly%20trimmed%20green%20borders%2C%20warm%20golden%20hour%20sunlight%2C%20professional%20land%20development%20photography%20with%20open%20ready%20to%20build%20atmosphere&width=800&height=600&seq=success-after-6&orientation=landscape',
    rating: 5,
    testimonial_comment: 'They cleared and graded the whole lot in under a week. Ready to build now.',
    created_at: '2026-01-19T00:00:00Z',
  },
];

export default function SuccessStoriesPage() {
  const { isDemo } = useDemo();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .eq('is_mock_data', isDemo)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setStories(data as Story[]);
      } else if (isDemo) {
        // Fall back to local mock stories in demo mode when the table is empty
        setStories(MOCK_STORIES);
      } else {
        setStories([]);
      }
    } catch {
      setStories(isDemo ? MOCK_STORIES : []);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="w-4 h-4 flex items-center justify-center">
          <i className={`${s <= rating ? 'ri-star-fill text-amber-500' : 'ri-star-line text-foreground-300'} text-sm`} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className={`flex-1 ${isDemo ? 'pt-28 md:pt-32' : 'pt-20 md:pt-24'}`}>
        {/* Hero */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="w-full px-4 md:px-8 lg:px-12 text-center">
            <div className="mb-6">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-sm font-label text-foreground-600 hover:text-primary-600 transition-colors cursor-pointer"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-arrow-left-line" />
                </div>
                Back to Home
              </button>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-900">
              Success Stories
            </h1>
            <p className="mt-4 text-base md:text-lg text-foreground-600 max-w-2xl mx-auto">
              Real before-and-after transformations across Guyana, delivered by verified tradespeople on BuildGuyana.gy.
            </p>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-14 md:py-20 bg-background-50">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="max-w-5xl mx-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stories.length === 0 ? (
                <div className="text-center py-16 bg-white border border-background-200/70 rounded-xl">
                  <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                    <i className="ri-image-line text-3xl text-foreground-400" />
                  </div>
                  <p className="text-foreground-600 text-sm">No success stories available yet.</p>
                  <p className="text-foreground-500 text-xs mt-1">
                    Check back soon as we add real project transformations from across Guyana.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stories.map((story) => (
                    <div
                      key={story.id}
                      className="bg-white border border-background-200/70 rounded-xl overflow-hidden"
                    >
                      {/* Before / After images */}
                      {(story.before_image_url || story.after_image_url) && (
                        <div className="grid grid-cols-2 gap-px bg-background-200/70">
                          <div className="relative aspect-[4/3] bg-background-100">
                            {story.before_image_url ? (
                              <img
                                src={story.before_image_url}
                                alt={`${story.name} before`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-image-line text-foreground-400 text-2xl" />
                              </div>
                            )}
                            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 bg-foreground-900/70 text-background-50 rounded-full font-label whitespace-nowrap">
                              Before
                            </span>
                          </div>
                          <div className="relative aspect-[4/3] bg-background-100">
                            {story.after_image_url ? (
                              <img
                                src={story.after_image_url}
                                alt={`${story.name} after`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-image-line text-foreground-400 text-2xl" />
                              </div>
                            )}
                            <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 bg-primary-500 text-background-50 rounded-full font-label whitespace-nowrap">
                              After
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-5 md:p-6">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="w-4 h-4 flex items-center justify-center">
                            <i className="ri-map-pin-line text-foreground-400 text-sm" />
                          </div>
                          <span className="text-xs text-foreground-500 font-label">
                            {story.location}
                          </span>
                        </div>

                        <h2 className="font-heading text-lg md:text-xl font-bold text-foreground-900 mb-2">
                          {story.name}
                        </h2>

                        <div className="mb-3">
                          {renderStars(story.rating)}
                        </div>

                        <p className="text-sm text-foreground-600 leading-relaxed">
                          {story.description}
                        </p>

                        {story.testimonial_comment && (
                          <div className="mt-4 pt-4 border-t border-background-200/70">
                            <div className="w-6 h-6 flex items-center justify-center mb-1">
                              <i className="ri-double-quotes-l text-lg text-primary-400" />
                            </div>
                            <p className="text-sm text-foreground-700 italic leading-relaxed">
                              "{story.testimonial_comment}"
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-foreground-400 mt-4">
                          {formatDate(story.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-20 bg-foreground-900">
          <div className="w-full px-4 md:px-8 lg:px-12 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-background-50">
              Your Success Story Starts Here
            </h2>
            <p className="mt-3 text-sm md:text-base text-background-300 max-w-xl mx-auto">
              Join the growing community of tradespeople winning jobs and building their businesses across Guyana.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="px-6 py-3 rounded-lg font-label text-sm font-semibold bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                Join as a Tradesperson
              </Link>
              <Link
                to="/how-it-works"
                className="px-6 py-3 rounded-lg font-label text-sm font-medium border border-background-50/20 text-background-50 hover:border-background-50/40 transition-colors whitespace-nowrap"
              >
                How It Works
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}