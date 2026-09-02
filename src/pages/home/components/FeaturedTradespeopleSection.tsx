import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface TradespersonCard {
  id: string;
  name: string;
  trade: string;
  location: string;
  region: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  image: string;
  verified: boolean;
}

export default function FeaturedTradespeopleSection() {
  const navigate = useNavigate();
  const [contractors, setContractors] = useState<TradespersonCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchContractors = async () => {
      setLoading(true);
      try {
        // Fetch verified contractors with profiles
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractors')
          .select(`
            id,
            profile_id,
            category,
            region,
            years_experience,
            verified,
            profiles(full_name, is_tradesperson)
          `)
          .eq('verification_status', 'verified')
          .neq('profiles.full_name', 'Deleted User')
          .eq('profiles.is_tradesperson', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (contractorError || !contractorData || contractorData.length === 0) {
          if (!cancelled) setContractors([]);
          return;
        }

        const contractorIds = contractorData.map((c: any) => c.id);
        const profileIds = [...new Set(contractorData.map((c: any) => c.profile_id).filter(Boolean))];

        // Fetch stats and profiles in parallel
        const [statsResult, profileResult] = await Promise.all([
          supabase.from('contractor_stats').select('contractor_id, average_rating, total_reviews').in('contractor_id', contractorIds),
          profileIds.length > 0
            ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', profileIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        const statsMap = new Map<string, { average_rating: number; total_reviews: number }>();
        (statsResult.data || []).forEach((s: any) => {
          statsMap.set(s.contractor_id, {
            average_rating: parseFloat(s.average_rating) || 0,
            total_reviews: s.total_reviews || 0,
          });
        });

        const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
        (profileResult.data || []).forEach((p: any) => {
          profileMap.set(p.id, { full_name: p.full_name || 'Tradesperson', avatar_url: p.avatar_url });
        });

        const mapped: TradespersonCard[] = contractorData.map((c: any) => {
          const stats = statsMap.get(c.id) || { average_rating: 0, total_reviews: 0 };
          const prof = profileMap.get(c.profile_id);
          const avatarUrl = prof?.avatar_url;
          const fallbackUrl = 'https://readdy.ai/api/search-image?query=Professional%20Guyanese%20construction%20tradesperson%20portrait%2C%20confident%20friendly%20expression%2C%20clean%20work%20attire%2C%20warm%20studio%20lighting%20with%20neutral%20background%2C%20editorial%20headshot%20photography%20with%20soft%20depth%20of%20field%2C%20professional%20yet%20approachable&width=400&height=500&seq=featured-contractor-main&orientation=portrait';
          return {
            id: c.id,
            name: prof?.full_name || 'Tradesperson',
            trade: c.category || 'General',
            location: c.region || 'Guyana',
            region: c.region || 'Guyana',
            rating: stats.average_rating,
            reviewCount: stats.total_reviews,
            yearsExperience: c.years_experience || 0,
            image: avatarUrl || fallbackUrl,
            verified: c.verified === true,
          };
        });

        if (!cancelled) setContractors(mapped);
      } catch {
        if (!cancelled) setContractors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchContractors();
    return () => { cancelled = true; };
  }, []);

  // Show only top 6
  const displayContractors = contractors.slice(0, 6);

  return (
    <section className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 md:mb-12 gap-3">
          <div>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground-900">
              Top-Rated Tradespeople Nationwide
            </h2>
            <p className="mt-2 text-sm md:text-base text-foreground-600">
              Verified pros with outstanding reviews across Georgetown, Berbice, West Demerara, and beyond
            </p>
          </div>
          <button
            onClick={() => navigate('/contractors')}
            className="font-label text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors whitespace-nowrap flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            View All
            <i className="ri-arrow-right-line" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-5">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayContractors.length === 0 ? null : (
            displayContractors.map((tp) => (
            <button
              key={tp.id}
              onClick={() => navigate(`/contractors/${tp.id}`)}
              className="group text-left bg-background-50 border border-background-200/70 rounded-lg overflow-hidden hover:shadow-lg hover:border-background-300 transition-all cursor-pointer"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={tp.image}
                  alt={tp.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {tp.verified && (
                  <div className="absolute top-3 right-3 bg-accent-500 text-background-50 font-label text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <i className="ri-shield-check-line text-xs" />
                    Verified
                  </div>
                )}
              </div>
              <div className="p-3 md:p-4">
                <h3 className="font-heading text-sm md:text-base font-semibold text-foreground-900">
                  {tp.name}
                </h3>
                <p className="text-xs text-foreground-500 mt-0.5">{tp.trade} &middot; {tp.location}</p>
                <div className="flex items-center gap-1 mt-2">
                  {tp.reviewCount > 0 ? (
                    <>
                      <div className="flex items-center gap-0.5">
                        <i className="ri-star-fill text-amber-500 text-xs" />
                        <span className="font-label text-xs font-semibold text-foreground-800">{tp.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-foreground-400">({tp.reviewCount} reviews)</span>
                    </>
                  ) : (
                    <span className="text-xs text-foreground-400 font-label">New</span>
                  )}
                </div>
              </div>
            </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}