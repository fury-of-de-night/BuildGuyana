import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { categories } from '@/mocks/categories';

interface CategoryCount {
  category: string;
  total_contractors: number;
  real_contractors: number;
  mock_contractors: number;
}

export default function CategoriesSection() {
  const navigate = useNavigate();
  const [categoryCounts, setCategoryCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      try {
        const { data } = await supabase
          .from('category_contractor_counts')
          .select('category, total_contractors');

        if (data && !cancelled) {
          const map = new Map<string, number>();
          data.forEach((row: CategoryCount) => {
            map.set(row.category, row.total_contractors);
          });
          setCategoryCounts(map);
        }
      } catch {
        // Silently fall back — no mock data needed
      }
    };
    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  const getCount = (categoryName: string): string => {
    const dbCount = categoryCounts.get(categoryName);
    if (dbCount !== undefined && dbCount > 0) return `${dbCount} tradespeople`;
    return '0 tradespeople';
  };

  return (
    <section className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="font-label text-xs font-semibold uppercase tracking-wider text-primary-500 mb-3">
            What do you need built?
          </div>
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground-900">
            Every Construction Need,{' '}
            <span className="text-primary-500">One Platform</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-2xl mx-auto">
            From house foundations to drainage culverts — find trusted tradespeople for all your construction and infrastructure projects across Guyana
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/contractors?category=${cat.id}`)}
              className="group relative rounded-lg overflow-hidden aspect-[4/3] md:aspect-[3/4] text-left cursor-pointer"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/80 via-foreground-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <h3 className="font-heading text-xs md:text-sm font-semibold text-background-50 leading-tight">
                  {cat.name}
                </h3>
                <p className="text-[10px] md:text-xs text-background-300 mt-0.5 hidden sm:block">
                  {getCount(cat.name)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}