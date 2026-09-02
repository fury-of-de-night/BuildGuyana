import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import { supabase } from '@/lib/supabase';

export default function HeroSection() {
  const navigate = useNavigate();
  const { user, profile, activeRole, contractorProfile, hasDualRoles, setActiveRole } = useAuth();
  const { startDemo } = useDemo();

  const isLoggedIn = !!user && !!profile;

  // Platform stats from database (auto-updated by triggers)
  const [platformStats, setPlatformStats] = useState({
    tradespeople: 0,
    jobs: 0,
    rating: 4.8,
    regions: 'Nationwide',
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        // Fetch dynamic counts directly from the database tables
        const [jobsResult, contractorsResult, settingsResult] = await Promise.all([
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('contractors').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
          supabase.from('platform_settings').select('key, value').in('key', ['stat_rating', 'stat_regions']),
        ]);

        if (cancelled) return;

        const jobsCount = jobsResult.count || 0;
        const tradespeopleCount = contractorsResult.count || 0;

        let rating = 4.8;
        let regions = 'Nationwide';

        if (settingsResult.data) {
          settingsResult.data.forEach((row: { key: string; value: string }) => {
            if (row.key === 'stat_rating') rating = parseFloat(row.value) || 4.8;
            if (row.key === 'stat_regions') regions = row.value ? `${row.value} Regions` : 'Nationwide';
          });
        }

        setPlatformStats({
          tradespeople: tradespeopleCount,
          jobs: jobsCount,
          rating,
          regions,
        });
        setStatsLoaded(true);
      } catch {
        // Silently fall back to hardcoded defaults
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  const formatStat = (count: number, fallback: string): string => {
    if (count > 0) return `${count}+`;
    if (statsLoaded) return `${count}`;
    return fallback;
  };

  const handleSwitchToProjectOwner = () => {
    setActiveRole('project_owner');
  };

  const handleSwitchToTradesperson = () => {
    setActiveRole('tradesperson');
    navigate('/dashboard/tradesperson');
  };

  // Tradesperson view
  if (isLoggedIn && activeRole === 'tradesperson') {
    return (
      <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=Construction%20workers%20building%20a%20modern%20Caribbean%20house%20with%20warm%20golden%20hour%20sunlight%2C%20tools%20and%20scaffolding%20visible%2C%20team%20collaboration%20on%20worksite%2C%20tropical%20setting%20with%20palm%20trees%2C%20professional%20documentary%20photography%20with%20rich%20warm%20earthy%20orange%20tones%20and%20inspiring%20atmosphere&width=1600&height=900&seq=hero-tradesperson&orientation=landscape"
            alt="Construction in Guyana"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/40 to-foreground-950/60" />
        </div>

        <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-16 md:pb-20">
          <div className="max-w-3xl">
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-background-50 leading-tight">
              Welcome back, {profile.full_name.split(' ')[0]}. Ready to find work?
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-background-200 max-w-xl leading-relaxed">
              Browse available jobs across all 10 regions of Guyana. Request to quote on jobs you're interested in — it's free. Only pay when you submit a detailed quote.
            </p>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={() => navigate('/dashboard/tradesperson')}
                className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-primary-500 text-background-50 rounded-md hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="ri-briefcase-line" />
                View Available Jobs
              </button>
              {hasDualRoles && (
                <button
                  onClick={handleSwitchToProjectOwner}
                  className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-background-50/10 backdrop-blur-sm text-background-50 border border-background-50/30 rounded-md hover:bg-background-50/20 transition-colors whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="ri-arrow-left-right-line" />
                  Switch to Project Owner View
                </button>
              )}
            </div>

            <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl">
              <div className="text-center bg-background-50/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-coin-line text-amber-400 text-sm" />
                  </div>
                </div>
                <div className="font-heading text-lg md:text-xl font-bold text-background-50">
                  Credits Wallet
                </div>
                <div className="font-label text-xs text-background-300 mt-0.5">
                  For submitting quotes
                </div>
              </div>
              <div className="text-center bg-background-50/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <div className="font-heading text-lg md:text-xl font-bold text-background-50">
                  {contractorProfile?.rating?.toFixed(1) || 'N/A'}
                </div>
                <div className="font-label text-xs text-background-300 mt-0.5">
                  Rating
                </div>
              </div>
              <div className="text-center bg-background-50/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <div className="font-heading text-lg md:text-xl font-bold text-background-50">
                  {contractorProfile?.review_count || 0}
                </div>
                <div className="font-label text-xs text-background-300 mt-0.5">
                  Reviews
                </div>
              </div>
              <div className="text-center bg-background-50/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <div className="font-heading text-lg md:text-xl font-bold text-background-50">
                  {contractorProfile?.region || 'N/A'}
                </div>
                <div className="font-label text-xs text-background-300 mt-0.5">
                  Your Region
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Project Owner view
  if (isLoggedIn && activeRole === 'project_owner') {
    return (
      <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=Modern%20Caribbean%20home%20exterior%20with%20construction%20plans%20blueprint%20on%20wooden%20table%2C%20warm%20golden%20hour%20sunlight%2C%20tropical%20garden%20setting%2C%20homeowner%20planning%20renovation%2C%20architectural%20photography%20with%20warm%20earthy%20orange%20tones%20and%20inspiring%20lifestyle%20atmosphere&width=1600&height=900&seq=hero-owner&orientation=landscape"
            alt="Home project planning"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/40 to-foreground-950/60" />
        </div>

        <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-16 md:pb-20">
          <div className="max-w-3xl">
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-background-50 leading-tight">
              Welcome back, {profile.full_name.split(' ')[0]}. What do you want to build today?
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-background-200 max-w-xl leading-relaxed">
              Post your construction job for free. Qualified tradespeople across Guyana will request to quote. You review their profiles, invite the best, and hire with confidence.
            </p>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link
                to="/post-job"
                className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-primary-500 text-background-50 rounded-md hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
              >
                <i className="ri-add-circle-line" />
                Post a New Job
              </Link>
              <Link
                to="/contractors"
                className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-background-50/10 backdrop-blur-sm text-background-50 border border-background-50/30 rounded-md hover:bg-background-50/20 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
              >
                <i className="ri-team-line" />
                Find Tradespeople
              </Link>
              {hasDualRoles && (
                <button
                  onClick={handleSwitchToTradesperson}
                  className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-background-50/10 backdrop-blur-sm text-background-50 border border-background-50/30 rounded-md hover:bg-background-50/20 transition-colors whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="ri-arrow-left-right-line" />
                  Switch to Tradesperson View
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default: Not logged in
  return (
    <section className="relative min-h-[600px] md:min-h-[750px] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=Aerial%20view%20of%20Georgetown%20Guyana%20skyline%20with%20construction%20cranes%20and%20new%20buildings%20rising%2C%20Demerara%20River%20visible%2C%20mix%20of%20modern%20and%20colonial%20architecture%2C%20warm%20golden%20hour%20sunlight%2C%20dramatic%20Caribbean%20sky%2C%20editorial%20photography%20with%20warm%20orange%20earthy%20color%20palette%20and%20rich%20authentic%20detail%20showing%20national%20development&width=1600&height=900&seq=hero-bg-nationwide&orientation=landscape"
          alt="Georgetown, Guyana skyline"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/50 via-foreground-950/40 to-foreground-950/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-16 md:pb-20">
        <div className="max-w-4xl">
          <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-background-50 leading-tight">
            Find Trusted Tradespeople
            <br />
            <span className="text-accent-300">Across All of Guyana</span>
          </h1>
          <p className="mt-4 md:mt-6 text-base md:text-lg text-background-200 max-w-xl leading-relaxed">
            Post your construction job for free. Get contacted by verified tradespeople for house building, fencing, drainage, roofing, concrete work, and more — serving all 10 Administrative Regions.
          </p>
          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4">
            <Link
              to="/post-job"
              className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-primary-500 text-background-50 rounded-md hover:bg-primary-600 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              <i className="ri-add-circle-line" />
              Post a Job — It&apos;s Free
            </Link>
            <Link
              to="/contractors"
              className="font-label font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 bg-background-50/10 backdrop-blur-sm text-background-50 border border-background-50/30 rounded-md hover:bg-background-50/20 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              <i className="ri-team-line" />
              Find a Tradesperson
            </Link>
          </div>

          {/* Demo CTA */}
          <div className="mt-4 md:mt-6">
            <button
              onClick={() => { startDemo(); navigate('/dashboard/project-owner'); }}
              className="inline-flex items-center gap-2 font-label text-sm md:text-base font-semibold px-5 md:px-6 py-2.5 md:py-3 bg-amber-400 hover:bg-amber-300 text-amber-900 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-play-circle-line" />
              </div>
              Try the Live Demo (No Sign-up Required)
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-10 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl">
          {[
            { value: formatStat(platformStats.tradespeople, '500+'), label: 'Verified Tradespeople' },
            { value: formatStat(platformStats.jobs, '2,400+'), label: 'Jobs Posted' },
            { value: typeof platformStats.rating === 'number' ? platformStats.rating.toFixed(1) : platformStats.rating, label: 'Avg. Rating' },
            { value: platformStats.regions, label: 'Serving All Regions' },
          ].map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <div className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-background-50">
                {stat.value}
              </div>
              <div className="font-label text-xs md:text-sm text-background-300 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}