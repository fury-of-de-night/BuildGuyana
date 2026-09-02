import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useDemo } from '@/contexts/DemoModeContext';
import { supabase } from '@/lib/supabase';
import { regions } from '@/mocks/locations';
import { categories } from '@/mocks/categories';
import EmptyRegionBanner from './components/EmptyRegionBanner';

interface TradespersonCard {
  id: string;
  profile_id: string;
  name: string;
  trade: string;
  location: string;
  region: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  image: string;
  verified: boolean;
  verification_status: string;
}

export default function Contractors() {
  const navigate = useNavigate();
  const { isDemo } = useDemo();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialRegion = searchParams.get('region') || 'all';

  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerifiedId, setFilterVerifiedId] = useState(false);
  const [filterBusinessRegistered, setFilterBusinessRegistered] = useState(false);
  const [filterLicensedProfessional, setFilterLicensedProfessional] = useState(false);

  const [contractors, setContractors] = useState<TradespersonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      // Fetch contractors with stats joined for tier-based sorting
      let contractorQuery = supabase
        .from('contractors')
        .select(`
          id,
          profile_id,
          category,
          region,
          years_experience,
          verified,
          verification_status,
          tier,
          id_verification_status,
          doc_business_reg,
          trade_license_status,
          profiles(full_name, is_tradesperson)
        `)
        .order('created_at', { ascending: false })
        .neq('profiles.full_name', 'Deleted User')
        .eq('profiles.is_tradesperson', true);

      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        contractorQuery = contractorQuery.or(`category.ilike.${q},region.ilike.${q}`);
      }

      if (filterVerifiedId) contractorQuery = contractorQuery.eq('id_verification_status', 'approved');
      if (filterBusinessRegistered) contractorQuery = contractorQuery.not('doc_business_reg', 'is', null);
      if (filterLicensedProfessional) contractorQuery = contractorQuery.eq('trade_license_status', 'approved');

      const { data: contractorData, error: contractorError } = await contractorQuery;

      if (contractorError) {
        setDbError('Failed to load tradespeople. Please try again.');
        setContractors([]);
        return;
      }

      if (!contractorData || contractorData.length === 0) {
        if (searchQuery.trim()) {
          const q = `%${searchQuery.trim()}%`;
          const { data: profileMatches } = await supabase
            .from('profiles')
            .select('id')
            .ilike('full_name', q);

          if (profileMatches && profileMatches.length > 0) {
            const matchedIds = profileMatches.map((p: any) => p.id);
            let matchedQuery = supabase
              .from('contractors')
              .select(`
                id,
                profile_id,
                category,
                region,
                years_experience,
                verified,
                verification_status,
                tier,
                id_verification_status,
                doc_business_reg,
                trade_license_status,
                profiles(full_name, is_tradesperson)
              `)
              .in('profile_id', matchedIds)
              .neq('profiles.full_name', 'Deleted User')
              .eq('profiles.is_tradesperson', true);

            if (filterVerifiedId) matchedQuery = matchedQuery.eq('id_verification_status', 'approved');
            if (filterBusinessRegistered) matchedQuery = matchedQuery.not('doc_business_reg', 'is', null);
            if (filterLicensedProfessional) matchedQuery = matchedQuery.eq('trade_license_status', 'approved');

            const { data: matchedContractors } = await matchedQuery;

            if (matchedContractors && matchedContractors.length > 0) {
              await enrichAndSetCards(matchedContractors);
              return;
            }
          }
        }

        setContractors([]);
        return;
      }

      await enrichAndSetCards(contractorData);
    } catch {
      setDbError('Something went wrong loading tradespeople. Please try again.');
      setContractors([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterVerifiedId, filterBusinessRegistered, filterLicensedProfessional]);

  // Enrich contractor data with profile names, stats, and tier sorting
  async function enrichAndSetCards(rawData: any[]) {
    try {
      const profileIds = [...new Set(rawData.map((c: any) => c.profile_id).filter(Boolean))];
      const contractorIds = rawData.map((c: any) => c.id);

      const [profileResult, statsResult] = await Promise.all([
        profileIds.length > 0
          ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', profileIds)
          : Promise.resolve({ data: [], error: null }),
        contractorIds.length > 0
          ? supabase.from('contractor_stats').select('contractor_id, average_rating, total_reviews').in('contractor_id', contractorIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      (profileResult.data || []).forEach((p: any) => {
        profileMap.set(p.id, { full_name: p.full_name || 'Tradesperson', avatar_url: p.avatar_url });
      });

      const statsMap = new Map<string, { average_rating: number; total_reviews: number }>();
      (statsResult.data || []).forEach((s: any) => {
        statsMap.set(s.contractor_id, {
          average_rating: parseFloat(s.average_rating) || 0,
          total_reviews: s.total_reviews || 0,
        });
      });

      // Tier rank for sorting (Elite=1, Pro=2, Basic=3, Free=4, Trial=5)
      const tierRank = (t: string | null) => {
        switch (t) {
          case 'elite': return 1;
          case 'pro': return 2;
          case 'basic': return 3;
          case 'free': return 4;
          case 'trial': return 5;
          default: return 6;
        }
      };

      let mapped: TradespersonCard[] = rawData.map((c: any) => {
        const prof = profileMap.get(c.profile_id);
        const stats = statsMap.get(c.id) || { average_rating: 0, total_reviews: 0 };
        const avatarUrl = prof?.avatar_url;
const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d1d5db'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";        return {
          id: c.id,
          profile_id: c.profile_id,
          name: prof?.full_name || 'Tradesperson',
          trade: c.category || 'General',
          location: c.region || 'Guyana',
          region: c.region || 'Guyana',
          rating: stats.average_rating,
          reviewCount: stats.total_reviews,
          yearsExperience: c.years_experience || 0,
          image: avatarUrl || fallbackImage,
          verified: c.verified === true,
          verification_status: c.verification_status || 'pending',
        };
      });

      // Sort by tier rank (Elite first), then by rating
      mapped.sort((a: any, b: any) => {
        const rankA = tierRank(rawData.find((c) => c.id === a.id)?.tier);
        const rankB = tierRank(rawData.find((c) => c.id === b.id)?.tier);
        if (rankA !== rankB) return rankA - rankB;
        return b.rating - a.rating;
      });

      setContractors(mapped);
    } catch {
      setDbError('Failed to load profile details. Please try again.');
      setContractors([]);
    }
  }

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  const selectedRegionData = useMemo(
    () => (selectedRegion !== 'all' ? regions.find((r) => r.id === selectedRegion) : null),
    [selectedRegion],
  );

  const filteredContractors = useMemo(() => {
    let result = contractors;

    if (selectedRegion !== 'all' && selectedRegionData) {
      result = result.filter((tp) => tp.region === selectedRegionData.name);
    }

    if (selectedCategory !== 'all') {
      const cat = categories.find((c) => c.id === selectedCategory);
      if (cat) {
        result = result.filter((tp) => tp.trade === cat.name);
      }
    }

    // Search is now handled by Supabase ilike — only fall back to client-side for mock data
    // The searchQuery is passed to fetchContractors dependency which triggers re-fetch
    return result;
  }, [contractors, selectedRegion, selectedRegionData, selectedCategory]);

  const isEmptyRegion = selectedRegion !== 'all' && selectedRegionData && selectedRegionData.contractorCount === 0;

  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const getRegionLabel = () => {
    if (selectedRegion === 'all') return 'All Regions';
    if (selectedRegionData) {
      return selectedRegionData.name.split(' — ')[1] || selectedRegionData.name;
    }
    return 'All Regions';
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />
      <main className={`${isDemo ? 'pt-24 md:pt-28' : 'pt-16 md:pt-20'}`}>
        {/* Header */}
        <section className="py-10 md:py-16 bg-background-100">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-900">
                Find Tradespeople Across Guyana
              </h1>
              <p className="mt-3 text-base md:text-lg text-foreground-600 max-w-2xl mx-auto">
                Browse verified tradespeople across all 10 Administrative Regions. Filter by trade, location, and rating to find the right professional for your project.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <section className={`sticky z-30 bg-background-50/95 backdrop-blur-md border-b border-background-200/70 ${isDemo ? 'top-28 md:top-32' : 'top-16 md:top-20'}`}>
          <div className="w-full px-4 md:px-8 lg:px-12 py-3 md:py-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-7xl mx-auto">
              {/* Region Filter */}
              <div className="relative flex-shrink-0">
                <select
                  value={selectedRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="font-label text-sm px-3 py-2.5 rounded-md border border-background-300/60 bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-400 w-full sm:w-auto min-w-[200px] cursor-pointer appearance-none pr-8"
                >
                  <option value="all">All Regions</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}{r.contractorCount === 0 ? ' (No tradespeople yet)' : ` (${r.contractorCount})`}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-500 text-sm pointer-events-none" />
              </div>

              {/* Category Filter */}
              <div className="relative flex-shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="font-label text-sm px-3 py-2.5 rounded-md border border-background-300/60 bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-400 w-full sm:w-auto min-w-[180px] cursor-pointer appearance-none pr-8"
                >
                  <option value="all">All Trades</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-500 text-sm pointer-events-none" />
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <i className="ri-search-line text-foreground-400 text-sm" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, trade, or location..."
                  className="font-label text-sm w-full pl-9 pr-4 py-2.5 rounded-md border border-background-300/60 bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-10 md:py-14">
          <div className="w-full px-4 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Verification Filters Sidebar */}
              <aside className="lg:w-64 shrink-0">
                <div className="bg-white border border-background-200/70 rounded-lg p-4 lg:sticky lg:top-40">
                  <h3 className="font-label text-sm font-semibold text-foreground-900 mb-3">Verification</h3>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterVerifiedId}
                        onChange={(e) => setFilterVerifiedId(e.target.checked)}
                        className="w-4 h-4 rounded border-background-300/60 text-primary-500 focus:ring-primary-400 cursor-pointer"
                      />
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-id-card-line text-foreground-500 text-sm" />
                      </div>
                      <span className="text-sm text-foreground-700 font-label whitespace-nowrap">Verified ID</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterBusinessRegistered}
                        onChange={(e) => setFilterBusinessRegistered(e.target.checked)}
                        className="w-4 h-4 rounded border-background-300/60 text-primary-500 focus:ring-primary-400 cursor-pointer"
                      />
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-building-2-line text-foreground-500 text-sm" />
                      </div>
                      <span className="text-sm text-foreground-700 font-label whitespace-nowrap">Business Registered</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterLicensedProfessional}
                        onChange={(e) => setFilterLicensedProfessional(e.target.checked)}
                        className="w-4 h-4 rounded border-background-300/60 text-primary-500 focus:ring-primary-400 cursor-pointer"
                      />
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-award-line text-foreground-500 text-sm" />
                      </div>
                      <span className="text-sm text-foreground-700 font-label whitespace-nowrap">Licensed Professional</span>
                    </label>
                  </div>
                  {(filterVerifiedId || filterBusinessRegistered || filterLicensedProfessional) && (
                    <button
                      onClick={() => { setFilterVerifiedId(false); setFilterBusinessRegistered(false); setFilterLicensedProfessional(false); }}
                      className="mt-4 text-xs font-label text-primary-600 hover:text-primary-700 cursor-pointer whitespace-nowrap"
                    >
                      Clear verification filters
                    </button>
                  )}
                </div>
              </aside>

              <div className="flex-1 min-w-0">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-24">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* DB Error Banner */}
              {dbError && !loading && (
                <div className="mb-6 p-4 rounded-md border border-accent-300/60 bg-accent-100/80">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-error-warning-line text-accent-600" />
                    </div>
                    <p className="text-sm text-accent-900">{dbError}</p>
                  </div>
                  <button
                    onClick={() => fetchContractors()}
                    className="mt-2 text-xs font-label font-medium text-accent-700 hover:text-accent-800 underline cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Loaded content */}
              {!loading && (
                <>
                  {/* Results Header */}
                  {!isEmptyRegion && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-2">
                      <div>
                        <p className="font-label text-sm text-foreground-600">
                          <strong className="text-foreground-900">{filteredContractors.length}</strong> tradesperson{filteredContractors.length !== 1 ? 's' : ''}
                          {selectedRegion !== 'all' && <> in <strong className="text-foreground-900">{getRegionLabel()}</strong></>}
                          {selectedCategory !== 'all' && <> &middot; {categories.find((c) => c.id === selectedCategory)?.name}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-400">Sorted by</span>
                        <span className="font-label text-sm font-semibold text-foreground-900">Tier & Rating</span>
                      </div>
                    </div>
                  )}

                  {/* Empty Region Fallback */}
                  {isEmptyRegion ? (
                    <EmptyRegionBanner regionId={selectedRegion} />
                  ) : filteredContractors.length === 0 ? (
                    /* No results for search */
                    <div className="text-center py-16 md:py-24">
                      <div className="w-14 h-14 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
                        <i className="ri-search-line text-foreground-400 text-xl" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-2">
                        No tradespeople found
                      </h3>
                      <p className="text-sm text-foreground-500 max-w-sm mx-auto">
                        Try adjusting your filters or search terms. We&apos;re adding new tradespeople across Guyana every week.
                      </p>
                      <button
                        onClick={() => { setSelectedRegion('all'); setSelectedCategory('all'); setSearchQuery(''); setFilterVerifiedId(false); setFilterBusinessRegistered(false); setFilterLicensedProfessional(false); }}
                        className="mt-4 font-label text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors cursor-pointer"
                      >
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    /* Contractor Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                      {filteredContractors.map((tp) => (
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
                            <p className="text-xs text-foreground-400 mt-0.5">{tp.region}</p>
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
                              <span className="text-xs text-foreground-400 ml-auto">{tp.yearsExperience} yrs</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}