import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { tradespeople } from '@/mocks/tradespeople';

// UUID v4 regex — blocks non-UUID values before they hit Supabase
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface VerificationBadge {
  type: 'id' | 'business' | 'license';
  label: string;
  expired?: boolean;
}

interface FullProfile {
  id: string;
  name: string;
  trade: string;
  categories: string[];
  location: string;
  region: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  image: string;
  verified: boolean;
  description: string;
  facebookUrl: string | null;
  portfolioImages: string[];
  verificationBadges: VerificationBadge[];
  responseTime: string;
  completedJobs: number;
  trustworthyProPoints: number;
  phone: string | null;
}

const BADGE_STYLES: Record<VerificationBadge['type'], { icon: string; color: string; bg: string }> = {
  id: { icon: 'ri-id-card-line', color: 'text-green-600', bg: 'bg-green-100' },
  business: { icon: 'ri-building-2-line', color: 'text-secondary-700', bg: 'bg-secondary-100' },
  license: { icon: 'ri-award-line', color: 'text-amber-600', bg: 'bg-amber-100' },
};

interface Review {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
}

const MOCK_REVIEWS: Record<string, Review[]> = {
  '1': [
    { id: 'r1', reviewer: 'Sarah W.', rating: 5, comment: 'Rajesh built our entire house from foundation to roof. Excellent quality work, on time, and very communicative throughout. Highly recommend!', date: '2026-05-14' },
    { id: 'r2', reviewer: 'David T.', rating: 5, comment: 'Very professional. Completed a 3-bedroom extension in 6 weeks. Clean site, good team.', date: '2026-04-22' },
    { id: 'r3', reviewer: 'Maria P.', rating: 4, comment: 'Good work overall. A few small items needed follow-up but he came back and fixed everything promptly.', date: '2026-03-10' },
  ],
  '2': [
    { id: 'r4', reviewer: 'Omar J.', rating: 5, comment: 'Marcia made the most beautiful custom gate for our property. The ironwork is incredible — everyone comments on it.', date: '2026-06-01' },
    { id: 'r5', reviewer: 'Patricia A.', rating: 5, comment: 'Fast, clean, and professional. Window grills done perfectly.', date: '2026-05-07' },
  ],
  '4': [
    { id: 'r6', reviewer: 'James B.', rating: 5, comment: 'Keisha re-roofed our 4-bedroom house. Zero leaks now. Great job!', date: '2026-06-12' },
    { id: 'r7', reviewer: 'Amanda L.', rating: 5, comment: 'Quick response, accurate quote, excellent work. The zinc sheets are perfectly sealed.', date: '2026-05-30' },
    { id: 'r8', reviewer: 'Raymond P.', rating: 5, comment: '5 stars — best roofing contractor in Berbice. Period.', date: '2026-05-18' },
  ],
};

const MOCK_PORTFOLIOS: Record<string, string[]> = {
  '1': [
    'https://readdy.ai/api/search-image?query=Completed%20two%20bedroom%20concrete%20house%20in%20tropical%20Guyana%20neighborhood%2C%20freshly%20painted%20exterior%20cream%20and%20terracotta%2C%20neat%20garden%2C%20palm%20trees%2C%20warm%20golden%20hour%20sunlight%2C%20professional%20architectural%20photography&width=800&height=600&seq=portfolio-house-1a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=New%20Caribbean%20house%20construction%20progress%20showing%20concrete%20block%20walls%20and%20wooden%20roof%20frame%2C%20red%20earth%20site%2C%20warm%20tropical%20daylight%2C%20construction%20documentation%20photography&width=800&height=600&seq=portfolio-house-1b&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Interior%20of%20newly%20completed%20Caribbean%20home%20showing%20smooth%20plaster%20walls%2C%20tiled%20floor%20and%20wood%20ceiling%2C%20warm%20natural%20light%2C%20clean%20modern%20finish&width=800&height=600&seq=portfolio-house-1c&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Concrete%20foundation%20slab%20being%20poured%20for%20new%20Caribbean%20house%2C%20wooden%20formwork%20and%20steel%20rebar%20visible%2C%20red%20clay%20soil%2C%20warm%20tropical%20daylight&width=800&height=600&seq=portfolio-house-1d&orientation=landscape',
  ],
  '2': [
    'https://readdy.ai/api/search-image?query=Beautifully%20fabricated%20decorative%20iron%20gate%20for%20Caribbean%20home%20entrance%2C%20intricate%20scrollwork%20design%2C%20warm%20sunlight%20casting%20shadows%2C%20professional%20craftsmanship%20showcase&width=800&height=600&seq=portfolio-welding-2a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Custom%20welded%20window%20security%20grills%20installed%20on%20a%20Caribbean%20home%2C%20black%20painted%20iron%20bars%20with%20decorative%20pattern%2C%20warm%20natural%20light&width=800&height=600&seq=portfolio-welding-2b&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Welder%20fabricating%20steel%20staircase%20railing%20in%20workshop%2C%20sparks%20flying%2C%20orange%20glow%20from%20welding%20arc%2C%20safety%20gear%2C%20industrial%20craft%20photography&width=800&height=600&seq=portfolio-welding-2c&orientation=landscape',
  ],
  '4': [
    'https://readdy.ai/api/search-image?query=Completed%20zinc%20sheet%20metal%20roof%20on%20a%20Caribbean%20house%2C%20neatly%20installed%20galvanized%20steel%20sheets%2C%20ridge%20cap%2C%20blue%20sky%20background%2C%20aerial%20view%20documentary%20photography&width=800&height=600&seq=portfolio-roofing-4a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Roofing%20team%20installing%20new%20zinc%20sheets%20on%20a%20Caribbean%20house%2C%20workers%20on%20roof%2C%20safety%20equipment%2C%20tropical%20setting%20with%20palm%20trees%2C%20warm%20daylight&width=800&height=600&seq=portfolio-roofing-4b&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Before%20and%20after%20comparison%20of%20Caribbean%20roofing%20replacement%2C%20old%20rusted%20zinc%20versus%20new%20bright%20galvanized%20steel%20sheets%2C%20professional%20documentation%20photography&width=800&height=600&seq=portfolio-roofing-4c&orientation=landscape',
  ],
};

const GENERIC_PORTFOLIO: Record<string, string[]> = {
  '3': [
    'https://readdy.ai/api/search-image?query=Professionally%20finished%20concrete%20driveway%20and%20patio%20at%20a%20Caribbean%20home%2C%20smooth%20grey%20concrete%20surface%20with%20brushed%20finish%2C%20tropical%20garden%20setting%2C%20warm%20golden%20hour%20sunlight%2C%20professional%20architectural%20photography&width=800&height=600&seq=portfolio-generic-3a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=New%20concrete%20patio%20slab%20being%20poured%20with%20workers%20troweling%20smooth%20finish%2C%20Caribbean%20residential%20setting%2C%20wooden%20formwork%20visible%2C%20warm%20natural%20daylight%2C%20documentary%20construction%20photography&width=800&height=600&seq=portfolio-generic-3b&orientation=landscape',
  ],
  '5': [
    'https://readdy.ai/api/search-image?query=Beautifully%20installed%20wooden%20picket%20fence%20and%20chain%20link%20gate%20at%20a%20Caribbean%20home%2C%20tropical%20garden%20landscaping%2C%20warm%20golden%20hour%20sunlight%2C%20professional%20exterior%20photography&width=800&height=600&seq=portfolio-generic-5a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Concrete%20panel%20fence%20installation%20at%20a%20tropical%20Caribbean%20property%2C%20neatly%20finished%20wall%20with%20metal%20gate%2C%20warm%20natural%20daylight%2C%20professional%20documentation%20photography&width=800&height=600&seq=portfolio-generic-5b&orientation=landscape',
  ],
  '6': [
    'https://readdy.ai/api/search-image?query=Completed%20concrete%20culvert%20installation%20across%20a%20dirt%20road%20in%20tropical%20Guyana%2C%20large%20pipe%20under%20compacted%20earth%2C%20red%20clay%20landscape%2C%20warm%20natural%20daylight%2C%20infrastructure%20photography&width=800&height=600&seq=portfolio-generic-6a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Storm%20drainage%20trench%20with%20concrete%20channel%20under%20construction%20at%20a%20Caribbean%20roadside%2C%20workers%20installing%20formwork%2C%20green%20tropical%20vegetation%2C%20warm%20daylight%2C%20construction%20photography&width=800&height=600&seq=portfolio-generic-6b&orientation=landscape',
  ],
  '7': [
    'https://readdy.ai/api/search-image?query=Large%20modern%20concrete%20house%20under%20tropical%20Caribbean%20sky%20with%20palm%20trees%2C%20newly%20completed%20construction%20project%2C%20warm%20golden%20hour%20sunlight%2C%20architectural%20photography&width=800&height=600&seq=portfolio-generic-7a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Construction%20site%20showing%20concrete%20block%20walls%20rising%20on%20a%20new%20Caribbean%20home%2C%20workers%20on%20scaffolding%2C%20blue%20sky%2C%20warm%20natural%20daylight%2C%20documentary%20photography&width=800&height=600&seq=portfolio-generic-7b&orientation=landscape',
  ],
  '8': [
    'https://readdy.ai/api/search-image?query=Newly%20installed%20zinc%20sheet%20metal%20roof%20on%20a%20Caribbean%20home%2C%20blue%20sky%20background%2C%20neat%20professional%20finish%2C%20warm%20tropical%20sunlight%2C%20documentary%20photography&width=800&height=600&seq=portfolio-generic-8a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Roofing%20contractor%20team%20replacing%20old%20roof%20with%20new%20galvanized%20zinc%20sheets%20on%20a%20Caribbean%20house%2C%20safety%20equipment%2C%20warm%20daylight%2C%20professional%20construction%20photography&width=800&height=600&seq=portfolio-generic-8b&orientation=landscape',
  ],
  '9': [
    'https://readdy.ai/api/search-image?query=Completed%20concrete%20culvert%20drainage%20system%20at%20a%20Guyana%20roadside%2C%20large%20diameter%20pipes%2C%20compacted%20earth%20fill%2C%20tropical%20landscape%2C%20warm%20natural%20daylight%2C%20infrastructure%20photography&width=800&height=600&seq=portfolio-generic-9a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Workers%20installing%20concrete%20drainage%20trench%20along%20a%20tropical%20roadside%2C%20red%20clay%20earth%2C%20wooden%20formwork%2C%20warm%20golden%20hour%20light%2C%20construction%20documentary%20photography&width=800&height=600&seq=portfolio-generic-9b&orientation=landscape',
  ],
  '10': [
    'https://readdy.ai/api/search-image?query=Beautifully%20stamped%20and%20textured%20concrete%20patio%20floor%20at%20a%20Caribbean%20home%2C%20decorative%20finish%2C%20tropical%20garden%20setting%2C%20warm%20golden%20hour%20sunlight%2C%20professional%20architectural%20photography&width=800&height=600&seq=portfolio-generic-10a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=New%20concrete%20driveway%20being%20poured%20with%20workers%20finishing%20surface%2C%20Caribbean%20residential%20setting%2C%20smooth%20trowel%20work%2C%20warm%20natural%20daylight%2C%20construction%20photography&width=800&height=600&seq=portfolio-generic-10b&orientation=landscape',
  ],
  '11': [
    'https://readdy.ai/api/search-image?query=Custom%20welded%20decorative%20security%20gate%20installed%20at%20Caribbean%20home%20entrance%2C%20black%20iron%20scrollwork%20design%2C%20tropical%20garden%20setting%2C%20warm%20daylight%2C%20craftsmanship%20photography&width=800&height=600&seq=portfolio-generic-11a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Welder%20fabricating%20steel%20stair%20railing%20in%20outdoor%20workshop%2C%20welding%20sparks%20glowing%20orange%2C%20safety%20gear%2C%20tropical%20Caribbean%20setting%2C%20industrial%20craft%20photography&width=800&height=600&seq=portfolio-generic-11b&orientation=landscape',
  ],
  '12': [
    'https://readdy.ai/api/search-image?query=Newly%20constructed%20residential%20house%20in%20tropical%20Guyana%20neighborhood%2C%20cream%20painted%20exterior%20with%20terracotta%20trim%2C%20neat%20garden%2C%20palm%20trees%2C%20warm%20golden%20hour%20light%2C%20architectural%20photography&width=800&height=600&seq=portfolio-generic-12a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Construction%20worker%20laying%20concrete%20blocks%20for%20house%20wall%20in%20Guyana%2C%20brick%20and%20mortar%20work%2C%20tropical%20setting%2C%20warm%20natural%20daylight%2C%20documentary%20construction%20photography&width=800&height=600&seq=portfolio-generic-12b&orientation=landscape',
  ],
  '13': [
    'https://readdy.ai/api/search-image?query=Beautiful%20chain-link%20fence%20installation%20around%20a%20Caribbean%20property%2C%20neatly%20tensioned%20with%20concrete%20posts%2C%20tropical%20garden%20background%2C%20warm%20daylight%2C%20professional%20photography&width=800&height=600&seq=portfolio-generic-13a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Automated%20sliding%20gate%20at%20Caribbean%20home%20entrance%2C%20metal%20gate%20on%20tracks%20with%20motor%2C%20tropical%20setting%2C%20warm%20natural%20daylight%2C%20professional%20installation%20photography&width=800&height=600&seq=portfolio-generic-13b&orientation=landscape',
  ],
  '14': [
    'https://readdy.ai/api/search-image?query=Large%20area%20of%20cleared%20and%20graded%20land%20in%20tropical%20Guyana%2C%20red%20earth%20soil%20exposed%20after%20bush%20clearing%2C%20green%20vegetation%20border%2C%20warm%20daylight%2C%20land%20development%20photography&width=800&height=600&seq=portfolio-generic-14a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Excavator%20machine%20working%20on%20land%20clearing%20and%20grading%20at%20a%20tropical%20construction%20site%2C%20palm%20trees%20and%20lush%20vegetation%2C%20warm%20golden%20hour%20light%2C%20documentary%20photography&width=800&height=600&seq=portfolio-generic-14b&orientation=landscape',
  ],
  '15': [
    'https://readdy.ai/api/search-image?query=Piles%20of%20stacked%20building%20materials%20including%20concrete%20blocks%2C%20cement%20bags%2C%20sand%20and%20timber%20at%20a%20supply%20yard%2C%20tropical%20Caribbean%20setting%2C%20organized%20storage%2C%20warm%20daylight%2C%20industrial%20photography&width=800&height=600&seq=portfolio-generic-15a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Delivery%20truck%20loaded%20with%20construction%20materials%20ready%20for%20dispatch%20at%20a%20building%20supply%20yard%2C%20tropical%20setting%2C%20blue%20sky%2C%20warm%20natural%20daylight%2C%20logistics%20photography&width=800&height=600&seq=portfolio-generic-15b&orientation=landscape',
  ],
  '16': [
    'https://readdy.ai/api/search-image?query=Newly%20installed%20zinc%20roof%20on%20a%20Caribbean%20house%20with%20neat%20ridge%20cap%2C%20blue%20sky%20background%2C%20professional%20finish%2C%20warm%20tropical%20sunlight%2C%20architectural%20photography&width=800&height=600&seq=portfolio-generic-16a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Roofing%20workers%20installing%20galvanized%20zinc%20sheets%20on%20a%20house%20roof%2C%20safety%20harnesses%2C%20tropical%20setting%20with%20palm%20trees%2C%20warm%20daylight%2C%20professional%20construction%20photography&width=800&height=600&seq=portfolio-generic-16b&orientation=landscape',
  ],
  '17': [
    'https://readdy.ai/api/search-image?query=Agricultural%20drainage%20trench%20system%20under%20construction%20in%20a%20tropical%20field%2C%20red%20clay%20soil%2C%20workers%20installing%20pipes%2C%20green%20vegetation%20background%2C%20warm%20daylight%2C%20infrastructure%20photography&width=800&height=600&seq=portfolio-generic-17a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Concrete%20drainage%20channel%20completed%20along%20a%20tropical%20roadside%2C%20neatly%20finished%20with%20grate%20covers%2C%20green%20surroundings%2C%20warm%20natural%20daylight%2C%20civil%20engineering%20photography&width=800&height=600&seq=portfolio-generic-17b&orientation=landscape',
  ],
  '18': [
    'https://readdy.ai/api/search-image?query=Yellow%20excavator%20backhoe%20and%20concrete%20mixer%20machinery%20parked%20at%20equipment%20rental%20yard%2C%20tropical%20Caribbean%20setting%2C%20well%20maintained%20heavy%20equipment%2C%20warm%20daylight%2C%20industrial%20photography&width=800&height=600&seq=portfolio-generic-18a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Construction%20machinery%20including%20bulldozer%20and%20compactor%20ready%20for%20rental%20at%20a%20tropical%20equipment%20yard%2C%20blue%20sky%2C%20palm%20trees%2C%20warm%20natural%20daylight%2C%20professional%20industrial%20photography&width=800&height=600&seq=portfolio-generic-18b&orientation=landscape',
  ],
  '19': [
    'https://readdy.ai/api/search-image?query=Professional%20plumber%20installing%20new%20bathroom%20sink%20and%20faucet%20in%20a%20Caribbean%20home%2C%20copper%20pipes%20and%20fittings%20visible%2C%20modern%20interior%2C%20warm%20natural%20light%2C%20craftsmanship%20photography&width=800&height=600&seq=portfolio-generic-19a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Completed%20bathroom%20plumbing%20renovation%20with%20new%20toilet%2C%20sink%2C%20and%20shower%20fixtures%2C%20modern%20Caribbean%20interior%20design%2C%20clean%20professional%20finish%2C%20warm%20ambient%20lighting&width=800&height=600&seq=portfolio-generic-19b&orientation=landscape',
  ],
  '20': [
    'https://readdy.ai/api/search-image?query=Licensed%20electrician%20installing%20a%20modern%20electrical%20panel%20with%20circuit%20breakers%20in%20a%20Caribbean%20home%2C%20organized%20wiring%2C%20professional%20workspace%2C%20warm%20natural%20light%2C%20technical%20photography&width=800&height=600&seq=portfolio-generic-20a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Newly%20installed%20ceiling%20fan%20with%20light%20fixture%20and%20recessed%20lighting%20in%20a%20Caribbean%20living%20room%2C%20clean%20modern%20interior%2C%20warm%20ambient%20lighting%2C%20professional%20electrical%20work%20showcase&width=800&height=600&seq=portfolio-generic-20b&orientation=landscape',
  ],
  '21': [
    'https://readdy.ai/api/search-image?query=Freshly%20painted%20interior%20living%20room%20in%20a%20Caribbean%20home%2C%20warm%20cream%20walls%20with%20crisp%20white%20trim%2C%20clean%20professional%20finish%2C%20natural%20light%20through%20windows%2C%20home%20renovation%20photography&width=800&height=600&seq=portfolio-generic-21a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Painter%20applying%20fresh%20exterior%20paint%20to%20a%20Caribbean%20house%20wall%2C%20ladder%20and%20equipment%2C%20tropical%20garden%20setting%2C%20warm%20daylight%2C%20professional%20painting%20work%20showcase&width=800&height=600&seq=portfolio-generic-21b&orientation=landscape',
  ],
  '22': [
    'https://readdy.ai/api/search-image?query=Completely%20renovated%20kitchen%20with%20new%20cabinets%2C%20countertops%2C%20and%20tile%20backsplash%20in%20a%20Caribbean%20home%2C%20modern%20interior%20design%2C%20warm%20natural%20lighting%2C%20professional%20renovation%20photography&width=800&height=600&seq=portfolio-generic-22a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Renovated%20bathroom%20with%20new%20tiling%2C%20vanity%2C%20and%20fixtures%20in%20a%20Caribbean%20home%2C%20clean%20modern%20finish%2C%20warm%20ambient%20lighting%2C%20professional%20home%20improvement%20photography&width=800&height=600&seq=portfolio-generic-22b&orientation=landscape',
  ],
  '23': [
    'https://readdy.ai/api/search-image?query=Beautifully%20installed%20ceramic%20tile%20floor%20with%20decorative%20pattern%20in%20a%20Caribbean%20home%20living%20room%2C%20clean%20professional%20finish%2C%20warm%20natural%20light%2C%20interior%20design%20photography&width=800&height=600&seq=portfolio-generic-23a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Professional%20tile%20installer%20laying%20porcelain%20floor%20tiles%20with%20spacers%20and%20leveling%20system%2C%20modern%20Caribbean%20home%20interior%2C%20warm%20ambient%20lighting%2C%20craftsmanship%20photography&width=800&height=600&seq=portfolio-generic-23b&orientation=landscape',
  ],
  '24': [
    'https://readdy.ai/api/search-image?query=Custom%20built%20hardwood%20kitchen%20cabinets%20with%20beautiful%20grain%20pattern%2C%20Caribbean%20home%20interior%2C%20warm%20natural%20light%2C%20professional%20joinery%20craftsmanship%2C%20architectural%20photography&width=800&height=600&seq=portfolio-generic-24a&orientation=landscape',
    'https://readdy.ai/api/search-image?query=Skilled%20carpenter%20working%20on%20a%20custom%20wooden%20door%20frame%20in%20a%20tropical%20workshop%2C%20sawdust%20in%20sunlight%2C%20woodworking%20tools%2C%20warm%20ambient%20lighting%2C%20artisan%20craft%20photography&width=800&height=600&seq=portfolio-generic-24b&orientation=landscape',
  ],
};

function getMockPortfolio(id: string): string[] {
  if (MOCK_PORTFOLIOS[id]) return MOCK_PORTFOLIOS[id];
  if (GENERIC_PORTFOLIO[id]) return GENERIC_PORTFOLIO[id];
  return GENERIC_PORTFOLIO['3'];
}

function getMockReviews(id: string): Review[] {
  if (MOCK_REVIEWS[id]) return MOCK_REVIEWS[id];
  return [
    { id: `${id}-r1`, reviewer: 'Michael A.', rating: 5, comment: 'Excellent work! Very professional and completed the job on time.', date: '2026-05-20' },
    { id: `${id}-r2`, reviewer: 'Sandra B.', rating: 4, comment: 'Good quality work. Would hire again.', date: '2026-04-15' },
  ];
}

export default function ContractorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, contractorProfile, profile: authProfile } = useAuth();
  const { isDemo } = useDemo();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [contactToast, setContactToast] = useState('');
  const [tab, setTab] = useState<'portfolio' | 'reviews'>('portfolio');
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Report User state
  const [canReport, setCanReport] = useState(false);
  const [reportedUserId, setReportedUserId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadProfile = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Check if viewing own profile
    if (user && contractorProfile && id === contractorProfile.id) {
      setIsOwnProfile(true);
    } else {
      setIsOwnProfile(false);
    }

    // First check mock data
    const mock = tradespeople.find((tp) => tp.id === id);
    if (mock) {
      const portfolio = getMockPortfolio(id);
      const mockReviews = getMockReviews(id);
      const verificationBadges: VerificationBadge[] = [];
      if (mock.id_verification_status === 'approved') {
        verificationBadges.push({ type: 'id', label: 'Verified ID' });
      }
      if (mock.doc_business_reg) {
        verificationBadges.push({ type: 'business', label: 'Business Registered' });
      }
      if (mock.trade_license_status === 'approved') {
        verificationBadges.push({ type: 'license', label: 'Licensed Professional' });
      }
      setProfile({
        id: mock.id,
        name: mock.name,
        trade: mock.trade,
        categories: [mock.trade],
        location: mock.location,
        region: mock.region,
        rating: mock.rating,
        reviewCount: mock.reviewCount,
        yearsExperience: mock.yearsExperience,
        image: mock.image,
        verified: mock.verified,
        description: mock.description,
        facebookUrl: null,
        portfolioImages: portfolio,
        verificationBadges,
        responseTime: 'Usually responds within 2 hours',
        completedJobs: Math.floor(mock.reviewCount * 1.4),
        trustworthyProPoints: 0,
        phone: null,
      });
      setReviews(mockReviews);
      setReportedUserId(null);
      setCanReport(false);
      setLoading(false);
      return;
    }

    // Try Supabase
    try {
      if (!UUID_RE.test(id)) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const contractorResult = await supabase
        .from('contractors')
        .select('id, profile_id, region, category, categories, rating, review_count, years_experience, verified, bio, facebook_page_url, portfolio_images, id_verification_status, doc_business_reg, trade_license_status, id_verification_expiry_date, business_verification_expiry_date, trade_license_expiry_date')
        .eq('id', id)
        .maybeSingle();

      if (contractorResult.error) throw contractorResult.error;
      if (!contractorResult.data) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const contractor = contractorResult.data;
      setReportedUserId(contractor.profile_id || null);
      const now = Date.now();
      const isExpired = (d: string | null | undefined) =>
        !!d && new Date(d).getTime() < now;
      const idExpired = isExpired(contractor.id_verification_expiry_date);
      const bizExpired = isExpired(contractor.business_verification_expiry_date);
      const licExpired = isExpired(contractor.trade_license_expiry_date);

      const verificationBadges: VerificationBadge[] = [];
      if (contractor.id_verification_status === 'approved') {
        verificationBadges.push({ type: 'id', label: 'Verified ID', expired: idExpired });
      }
      if (contractor.doc_business_reg) {
        verificationBadges.push({ type: 'business', label: 'Business Registered', expired: bizExpired });
      }
      if (contractor.trade_license_status === 'approved') {
        verificationBadges.push({ type: 'license', label: 'Licensed Professional', expired: licExpired });
      }
      const profileResult = await supabase
        .from('profiles')
        .select('full_name, region, location, phone, avatar_url, trustworthy_pro_points')
        .eq('id', contractor.profile_id)
        .maybeSingle();

      const prof = profileResult.data;

      // Get reviews
      const reviewResult = await supabase
        .from('reviews')
        .select('*, profiles!reviewer_id(full_name)')
        .eq('contractor_id', id)
        .order('created_at', { ascending: false });

      const reviewData = (reviewResult.data || []).map((r: any) => ({
        id: r.id,
        reviewer: r.profiles?.full_name || 'Anonymous',
        rating: r.rating,
        comment: r.comment || '',
        date: r.created_at,
      }));

      setProfile({
        id: contractor.id,
        name: prof?.full_name || 'Unknown',
        trade: contractor.category || 'General Contractor',
        categories: contractor.categories || [contractor.category],
        location: prof?.location || contractor.region,
        region: prof?.region || contractor.region,
        rating: contractor.rating || 0,
        reviewCount: contractor.review_count || 0,
        yearsExperience: contractor.years_experience || 0,
        image: prof?.avatar_url || (contractor.portfolio_images || [])[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d1d5db'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E",
        verified: contractor.verified || false,
        description: contractor.bio || '',
        facebookUrl: contractor.facebook_page_url || null,
        portfolioImages: contractor.portfolio_images || [],
        verificationBadges,
        responseTime: 'Usually responds within 4 hours',
        completedJobs: contractor.review_count || 0,
        trustworthyProPoints: prof?.trustworthy_pro_points || 0,
        phone: null,
      });
      setReviews(reviewData);
    } catch (err) {
      console.error('Failed to load contractor profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [id, user, contractorProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Check shortlist status when user or profile changes
  useEffect(() => {
    if (!user || !id) {
      setIsShortlisted(false);
      return;
    }
    const checkShortlist = async () => {
      try {
        const { data } = await supabase
          .from('shortlists')
          .select('id')
          .eq('homeowner_id', user.id)
          .eq('contractor_id', id)
          .maybeSingle();
        setIsShortlisted(!!data);
      } catch {
        setIsShortlisted(false);
      }
    };
    checkShortlist();
  }, [user, id]);

  // Check whether the current user has a completed/hired history with this tradesperson
  useEffect(() => {
    if (!user || !id) {
      setCanReport(false);
      return;
    }
    const checkReportEligibility = async () => {
      try {
        const { data } = await supabase
          .from('project_agreements')
          .select('id')
          .eq('homeowner_id', user.id)
          .eq('contractor_id', id)
          .in('status', ['completed', 'hired', 'accepted'])
          .limit(1);
        setCanReport(!!(data && data.length > 0));
      } catch {
        setCanReport(false);
      }
    };
    checkReportEligibility();
  }, [user, id]);

  const handleShortlistToggle = async () => {
    if (!user) {
      setContactToast('Please log in or sign up to save tradespeople.');
      setTimeout(() => setContactToast(''), 4000);
      return;
    }
    if (!id) return;

    setShortlistLoading(true);

    try {
      if (isShortlisted) {
        // Remove from shortlist
        await supabase
          .from('shortlists')
          .delete()
          .eq('homeowner_id', user.id)
          .eq('contractor_id', id);
        setIsShortlisted(false);
        setContactToast('Removed from your saved list.');
      } else {
        // Add to shortlist
        await supabase
          .from('shortlists')
          .insert({
            homeowner_id: user.id,
            contractor_id: id,
          });

        setIsShortlisted(true);
        setContactToast('Added to your saved list!');

        // Send notification to the contractor
        try {
          const { data: contractorData } = await supabase
            .from('contractors')
            .select('profile_id')
            .eq('id', id)
            .maybeSingle();

          if (contractorData?.profile_id) {
            const ownerName = authProfile?.full_name || user.email || 'A project owner';
            const contractorName = authProfile?.full_name || 'You';
            await supabase
              .from('notifications')
              .insert({
                user_id: contractorData.profile_id,
                      title: 'A project owner saved your profile!',
                      message: `${ownerName} has saved your profile. This means they're interested in your services and may invite you to quote on a job soon.`,
                is_read: false,
              });
          }
        } catch {
          // Notification failure is non-critical
        }
      }
    } catch {
      setContactToast('Something went wrong. Please try again.');
    } finally {
      setShortlistLoading(false);
      setTimeout(() => setContactToast(''), 3000);
    }
  };

  const handleContact = () => {
    if (!user) {
      setContactToast('Please log in or sign up to contact tradespeople.');
      setTimeout(() => setContactToast(''), 4000);
      return;
    }
    setContactToast('Contact feature coming soon — the tradesperson will receive your inquiry!');
    setTimeout(() => setContactToast(''), 4000);
  };

  const handleReportSubmit = async () => {
    if (!user || !reportedUserId) {
      setReportFeedback({ type: 'error', message: 'You must be logged in to report a user.' });
      return;
    }
    if (!reportReason) {
      setReportFeedback({ type: 'error', message: 'Please select a reason.' });
      return;
    }
    setReportSubmitting(true);
    setReportFeedback(null);
    try {
      const { error: insertErr } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason: reportReason,
          details: reportDetails.trim() || null,
        });
      if (insertErr) throw insertErr;
      setReportFeedback({ type: 'success', message: 'Report submitted. Our team will review it.' });
      setTimeout(() => {
        setShowReportModal(false);
        setReportFeedback(null);
        setReportReason('');
        setReportDetails('');
      }, 1500);
    } catch (err: any) {
      setReportFeedback({ type: 'error', message: err?.message || 'Failed to submit report.' });
    } finally {
      setReportSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GY', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 px-4">
          <div className="w-14 h-14 mb-4 flex items-center justify-center">
            <i className="ri-user-search-line text-3xl text-foreground-400" />
          </div>
          <h2 className="font-heading text-xl text-foreground-900 mb-2">Tradesperson Not Found</h2>
          <p className="text-foreground-600 text-sm mb-4">This profile doesn't exist or may have been removed.</p>
          <button
            onClick={() => navigate('/contractors')}
            className="px-4 py-2 bg-primary-500 text-background-50 text-sm font-label font-medium rounded-md hover:bg-primary-600 transition-colors cursor-pointer"
          >
            Browse Tradespeople
          </button>
        </div>
      </div>
    );
  }

  const displayImage = profile.portfolioImages.length > 0 ? profile.portfolioImages[activeImage] : profile.image;

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />

      {contactToast && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[100] bg-foreground-900 text-background-50 rounded-md px-5 py-3 shadow-sm max-w-sm text-center ${isDemo ? 'top-28' : 'top-20'}`}>
          <p className="text-sm font-label">{contactToast}</p>
        </div>
      )}

      <main className={`${isDemo ? 'pt-24 md:pt-28' : 'pt-16 md:pt-20'}`}>
        {/* Back Button */}
        <div className="w-full px-4 md:px-8 lg:px-12 pt-6 pb-2">
          <button
            onClick={() => navigate('/contractors')}
            className="inline-flex items-center gap-2 text-sm font-label text-foreground-600 hover:text-foreground-900 transition-colors cursor-pointer"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-left-line" />
            </div>
            Back to Tradespeople
          </button>
        </div>

        <div className="w-full px-4 md:px-8 lg:px-12 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-4">

              {/* Sidebar: Profile Card */}
              <aside className="lg:col-span-1 space-y-4">
                {/* Main Profile Card */}
                <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h1 className="font-heading text-xl font-bold text-foreground-900">{profile.name}</h1>
                      {profile.verified && (
                        <span className="shrink-0 text-xs px-2 py-0.5 bg-accent-500 text-background-50 rounded-full font-label font-semibold flex items-center gap-1 whitespace-nowrap">
                          <i className="ri-shield-check-line text-xs" />
                          Verified
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-foreground-600 font-label mb-1">{profile.trade}</p>
                    <p className="text-xs text-foreground-500 flex items-center gap-1 mb-3">
                      <div className="w-3 h-3 flex items-center justify-center">
                        <i className="ri-map-pin-line" />
                      </div>
                      {profile.location} &middot; {profile.region}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          s <= Math.round(profile.rating)
                            ? <i key={s} className="ri-star-fill text-amber-500 text-sm" />
                            : <i key={s} className="ri-star-line text-amber-500 text-sm" />
                        ))}
                      </div>
                      <span className="font-label text-sm font-semibold text-foreground-800">{profile.rating.toFixed(1)}</span>
                      <span className="text-xs text-foreground-500">({profile.reviewCount} reviews)</span>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-background-200/70">
                      <div className="text-center">
                        <p className="font-heading text-base font-bold text-foreground-900">{profile.yearsExperience}</p>
                        <p className="text-xs text-foreground-500 font-label">Yrs Exp.</p>
                      </div>
                      <div className="text-center">
                        <p className="font-heading text-base font-bold text-foreground-900">{profile.completedJobs}+</p>
                        <p className="text-xs text-foreground-500 font-label">Jobs</p>
                      </div>
                      <div className="text-center">
                        <p className="font-heading text-base font-bold text-foreground-900">{profile.rating.toFixed(1)}</p>
                        <p className="text-xs text-foreground-500 font-label">Rating</p>
                      </div>
                    </div>

                    {/* Reputation Points */}
                    {profile.trustworthyProPoints > 0 && (
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-primary-50 border border-primary-200/60 rounded-md">
                        <span className="text-base">🏆</span>
                        <span className="text-xs font-label font-semibold text-primary-700 whitespace-nowrap">
                          {profile.trustworthyProPoints} Trustworthy Pro Points
                        </span>
                      </div>
                    )}

                    {/* Response Time */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-time-line text-xs text-foreground-500" />
                      </div>
                      <span className="text-xs text-foreground-600 font-label">{profile.responseTime}</span>
                    </div>

                    {/* Shortlist Button */}
                    {isOwnProfile ? (
                      <div className="w-full py-2.5 px-4 text-center text-sm font-label text-foreground-500 bg-background-100 border border-background-200/70 rounded-md">
                        This is your profile
                      </div>
                    ) : (
                      <button
                        onClick={handleShortlistToggle}
                        disabled={shortlistLoading}
                        className={`w-full py-2.5 px-4 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 mb-2 ${
                          isShortlisted
                            ? 'bg-accent-500 text-background-50 hover:bg-accent-600'
                            : 'bg-background-50 hover:bg-accent-50 text-foreground-700 border border-background-200/70 hover:border-accent-200/60'
                        }`}
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className={isShortlisted ? 'ri-bookmark-fill' : 'ri-bookmark-line'} />
                        </div>
                        {isShortlisted ? 'Saved' : shortlistLoading ? 'Saving...' : 'Invite to Quote'}
                      </button>
                    )}

                    {/* Contact Button */}
                    {!isOwnProfile && (
                      <button
                        onClick={handleContact}
                        className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-message-2-line" />
                        </div>
                        Request a Quote
                      </button>
                    )}

                    {/* Report User — only visible if the current user has a completed/hired job with them */}
                    {!isOwnProfile && canReport && (
                      <button
                        onClick={() => { setShowReportModal(true); setReportReason(''); setReportDetails(''); setReportFeedback(null); }}
                        className="mt-2 w-full py-2.5 px-4 text-sm font-label font-medium text-accent-600 hover:text-accent-700 border border-accent-300/60 hover:border-accent-400/60 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-flag-line" />
                        </div>
                        Report User
                      </button>
                    )}

                    {profile.facebookUrl && (
                      <a
                        href={profile.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-2 w-full py-2.5 px-4 bg-background-50 hover:bg-background-100 text-foreground-700 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 border border-background-200/70"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-facebook-circle-line" />
                        </div>
                        View Facebook Page
                      </a>
                    )}
                  </div>
                </div>

                {/* Verification Badges */}
                {profile.verificationBadges.length > 0 && (
                  <div className="bg-white border border-background-200/70 rounded-lg p-4">
                    <h3 className="font-heading text-sm text-foreground-900 mb-3">Badges & Credentials</h3>
                    <div className="space-y-2">
                      {profile.verificationBadges.map((badge) => {
                        const style = badge.expired
                          ? { icon: BADGE_STYLES[badge.type].icon, color: 'text-foreground-400', bg: 'bg-background-200' }
                          : BADGE_STYLES[badge.type];
                        return (
                          <div key={badge.type} className="flex items-center gap-2 flex-wrap">
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full ${style.bg}`}>
                              <i className={`${style.icon} text-xs ${style.color}`} />
                            </div>
                            <span className={`text-xs font-label font-medium ${badge.expired ? 'text-foreground-400' : 'text-foreground-700'}`}>
                              {badge.label}
                            </span>
                            {badge.expired && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-background-200 text-foreground-500 rounded-full font-label font-semibold uppercase whitespace-nowrap">
                                Expired
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {profile.categories.length > 1 && (
                  <div className="bg-white border border-background-200/70 rounded-lg p-4">
                    <h3 className="font-heading text-sm text-foreground-900 mb-3">Also Provides</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.categories.map((cat) => (
                        <span key={cat} className="text-xs px-2.5 py-1 bg-secondary-100 text-secondary-900 rounded-full font-label whitespace-nowrap">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* About */}
                <div className="bg-white border border-background-200/70 rounded-lg p-5 md:p-6">
                  <h2 className="font-heading text-lg text-foreground-900 mb-3">About {profile.name.split(' ')[0]}</h2>
                  <p className="text-sm text-foreground-600 leading-relaxed">{profile.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full font-label whitespace-nowrap">
                      {profile.trade}
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">
                      {profile.region}
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-background-100 text-foreground-600 rounded-full font-label whitespace-nowrap">
                      {profile.yearsExperience} yrs experience
                    </span>
                  </div>
                </div>

                {/* Portfolio & Reviews Tabs */}
                <div className="bg-white border border-background-200/70 rounded-lg overflow-hidden">
                  <div className="flex border-b border-background-200/70">
                    {(['portfolio', 'reviews'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-3 px-4 text-sm font-label font-medium transition-colors cursor-pointer whitespace-nowrap capitalize ${
                          tab === t
                            ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                            : 'text-foreground-600 hover:text-foreground-800 hover:bg-background-50'
                        }`}
                      >
                        {t === 'portfolio' ? `Portfolio (${profile.portfolioImages.length})` : `Reviews (${profile.reviewCount})`}
                      </button>
                    ))}
                  </div>

                  <div className="p-5 md:p-6">
                    {tab === 'portfolio' && (
                      <div>
                        {profile.portfolioImages.length === 0 ? (
                          <div className="text-center py-12 bg-background-50 rounded-lg border border-background-200/70">
                            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                              <i className="ri-image-line text-2xl text-foreground-400" />
                            </div>
                            <p className="text-sm text-foreground-600">No portfolio images yet.</p>
                          </div>
                        ) : (
                          <>
                            {/* Main Image */}
                            <div className="aspect-video w-full overflow-hidden rounded-lg mb-3 bg-background-100">
                              <img
                                src={displayImage}
                                alt={`${profile.name} portfolio ${activeImage + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Thumbnails */}
                            {profile.portfolioImages.length > 1 && (
                              <div className="flex gap-2 flex-wrap">
                                {profile.portfolioImages.map((img, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors cursor-pointer flex-shrink-0 ${
                                      idx === activeImage ? 'border-primary-500' : 'border-transparent hover:border-background-300'
                                    }`}
                                  >
                                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {tab === 'reviews' && (
                      <div className="space-y-4">
                        {reviews.length === 0 ? (
                          <div className="text-center py-12 bg-background-50 rounded-lg border border-background-200/70">
                            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                              <i className="ri-star-line text-2xl text-foreground-400" />
                            </div>
                            <p className="text-sm text-foreground-600">No reviews yet.</p>
                          </div>
                        ) : (
                          <>
                            {/* Rating Summary */}
                            <div className="flex items-center gap-4 p-4 bg-background-50 border border-background-200/70 rounded-lg mb-4">
                              <div className="text-center">
                                <p className="font-heading text-4xl font-bold text-foreground-900">{profile.rating.toFixed(1)}</p>
                                <div className="flex items-center justify-center gap-0.5 mt-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    s <= Math.round(profile.rating)
                                      ? <i key={s} className="ri-star-fill text-amber-500 text-sm" />
                                      : <i key={s} className="ri-star-line text-amber-500 text-sm" />
                                  ))}
                                </div>
                                <p className="text-xs text-foreground-500 mt-1">{profile.reviewCount} reviews</p>
                              </div>
                              <div className="flex-1">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                  const count = reviews.filter((r) => r.rating === stars).length;
                                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                  return (
                                    <div key={stars} className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-label text-foreground-500 w-3">{stars}</span>
                                      <div className="w-3 h-3 flex items-center justify-center">
                                        <i className="ri-star-fill text-amber-400 text-xs" />
                                      </div>
                                      <div className="flex-1 h-1.5 bg-background-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-amber-400 rounded-full"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-foreground-400 w-4">{count}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {reviews.map((review) => (
                              <div key={review.id} className="border-b border-background-200/70 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="text-sm font-medium text-foreground-800 font-label">{review.reviewer}</p>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        s <= review.rating
                                          ? <i key={s} className="ri-star-fill text-amber-500 text-xs" />
                                          : <i key={s} className="ri-star-line text-amber-500 text-xs" />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-xs text-foreground-400">{formatDate(review.date)}</span>
                                </div>
                                <p className="text-sm text-foreground-600 leading-relaxed">{review.comment}</p>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA at bottom */}
                {!isOwnProfile && (
                  <div className="bg-primary-50 border border-primary-200/50 rounded-lg p-5 text-center">
                    <h3 className="font-heading text-base text-foreground-900 mb-1">
                      Ready to work with {profile?.name?.split(' ')[0]}?
                    </h3>
                    <p className="text-sm text-foreground-600 mb-4">
                      Post your job for free or send a direct quote request.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={handleContact}
                        className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Request a Quote
                      </button>
                      <button
                        onClick={() => navigate('/post-job')}
                        className="px-5 py-2.5 bg-background-50 hover:bg-background-100 text-foreground-700 text-sm font-label font-medium rounded-md border border-background-200/70 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Post a Job Instead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-background-200/70 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="font-heading text-lg text-foreground-900 mb-1">Report User</h2>
            <p className="text-sm text-foreground-600 mb-4">Report this tradesperson for inappropriate behavior.</p>
            {reportFeedback && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                reportFeedback.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-accent-100/80 border border-accent-300/60 text-accent-900'
              }`}>
                {reportFeedback.message}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Reason <span className="text-accent-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="">Select a reason</option>
                  <option value="No-show">No-show</option>
                  <option value="Unprofessional">Unprofessional</option>
                  <option value="Spam">Spam</option>
                  <option value="Poor Quality">Poor Quality</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5 font-label">
                  Details (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-md bg-background-50 text-foreground-900 focus:outline-none focus:border-primary-500 resize-vertical"
                  placeholder="Describe what happened..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 px-4 border border-background-200/70 text-foreground-700 text-sm font-label font-medium rounded-md hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={reportSubmitting || !reportReason}
                className="flex-1 py-2.5 px-4 bg-accent-500 hover:bg-accent-600 text-background-50 text-sm font-label font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}