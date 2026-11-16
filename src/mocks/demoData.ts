import type { Profile, ContractorProfile } from '@/contexts/AuthContext';

export interface DemoJob {
  id: string;
  homeowner_id: string;
  title: string;
  category: string;
  description: string;
  region: string;
  location: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
}

export interface DemoLead {
  id: string;
  job_id: string;
  job_title: string;
  job_category: string;
  job_region: string;
  unlocked_at: string;
  cost_credits: number;
  homeowner_phone: string;
  status: 'requested' | 'approved' | 'quote_submitted' | 'hired';
  contractor_id?: string;
}

export interface DemoTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface DemoMilestone {
  id: string;
  job_id: string;
  title: string;
  description: string;
  status: 'not_started' | 'photo_submitted' | 'approved';
  payment_certificate: boolean;
  updated_at: string;
}

export const DEMO_TRADESPERSON_PROFILE: Profile = {
  id: 'demo-tradesperson-001',
  role: 'tradesperson',
  full_name: 'Rajesh Singh',
  phone: '5926123456',
  region: 'Region 4',
  location: 'Georgetown',
  avatar_url: null,
  created_at: '2026-01-15T00:00:00Z',
  is_tradesperson: true,
  is_project_owner: true,
  deleted_at: null,
  accepted_policy_version: null,
  reliable_payer_points: 0,
  trustworthy_pro_points: 0,
};

export const DEMO_TRADESPERSON_CONTRACTOR: ContractorProfile = {
  id: 'demo-contractor-001',
  profile_id: 'demo-tradesperson-001',
  category: 'House Construction',
  categories: ['House Construction', 'Concrete Works', 'Roofing'],
  secondary_trades: ['Masonry & Brickwork', 'Tiling & Flooring'],
  region: 'Region 4',
  bio: 'Experienced builder with 10+ years serving Georgetown and surrounding areas.',
  years_experience: 10,
  verified: true,
  verification_status: 'verified',
  verification_doc_url: null,
  doc_id_card: null,
  doc_passport: null,
  total_leads_unlocked: 0,
  is_business: false,
  business_name: null,
  is_verified_business: false,
  business_type: 'sole_proprietor',
  director_ids: [],
  payment_method_details: null,
  payout_details: null,
  trial_started_at: null,
  trial_shortlists_used: 0,
  materials_supplied: [],
  doc_business_reg: 'https://res.cloudinary.com/buildguyana/demo/business-reg-rajesh-singh.pdf',
  doc_gra: null,
  doc_nis: null,
  doc_profile: null,
  id_verification_status: 'approved',
  trade_license_status: 'approved',
  trade_license_number: 'TL-2026-0042',
  trade_license_doc_url: null,
  tier: 'elite',
  tier_expires_at: '2027-01-15T00:00:00Z',
  portfolio_images: [
    'https://readdy.ai/api/search-image?query=Beautiful%20completed%20Caribbean%20house%20with%20modern%20design%20warm%20cream%20exterior%20walls%20red%20roof%20tropical%20garden%20palm%20trees%20architectural%20photography%20with%20warm%20natural%20lighting%20and%20clean%20composition&width=600&height=800&seq=demo-portfolio-1&orientation=portrait',
    'https://readdy.ai/api/search-image?query=Finished%20concrete%20driveway%20at%20Caribbean%20home%20smooth%20grey%20surface%20tropical%20landscaping%20palm%20trees%20warm%20golden%20hour%20sunlight%20professional%20real%20estate%20photography%20with%20clean%20lines&width=600&height=800&seq=demo-portfolio-2&orientation=portrait',
    'https://readdy.ai/api/search-image?query=Interior%20renovation%20completed%20Caribbean%20living%20room%20modern%20tile%20flooring%20white%20walls%20warm%20natural%20lighting%20tropical%20decor%20professional%20interior%20photography&width=600&height=800&seq=demo-portfolio-3&orientation=portrait',
  ],
  facebook_page_url: null,
  rating: 4.8,
  review_count: 42,
  badge_id: null,
  created_at: '2026-01-15T00:00:00Z',
};

export const DEMO_PROJECT_OWNER_PROFILE: Profile = {
  id: 'demo-owner-001',
  role: 'project_owner',
  full_name: 'Sarah Williams',
  phone: '5926234567',
  region: 'Region 6',
  location: 'New Amsterdam',
  avatar_url: null,
  created_at: '2026-02-20T00:00:00Z',
  is_tradesperson: true,
  is_project_owner: true,
  deleted_at: null,
  accepted_policy_version: null,
  reliable_payer_points: 0,
  trustworthy_pro_points: 0,
};

export const DEMO_WALLET_BALANCE = 50;

export const DEMO_JOBS: DemoJob[] = [
  {
    id: 'demo-job-1',
    homeowner_id: 'demo-owner-001',
    title: 'New House Build — 2 Bedroom Concrete',
    category: 'House Construction',
    description: 'Looking for experienced house builder to construct a 2-bedroom concrete house on our plot in New Amsterdam. Foundation is already laid. Need walls, roofing, plumbing rough-in, and electrical conduit.',
    region: 'Region 6',
    location: 'New Amsterdam',
    budget_min: 3000000,
    budget_max: 5000000,
    status: 'open',
    created_at: '2026-06-28T00:00:00Z',
  },
  {
    id: 'demo-job-2',
    homeowner_id: 'demo-owner-001',
    title: 'Culvert Installation — Road Crossing',
    category: 'Culverts & Drains',
    description: 'Need a 24-inch concrete culvert installed at our farm access road crossing. Includes excavation, pipe laying, backfill, and compacting.',
    region: 'Region 6',
    location: 'Corentyne',
    budget_min: 120000,
    budget_max: 200000,
    status: 'open',
    created_at: '2026-06-30T00:00:00Z',
  },
  {
    id: 'demo-job-3',
    homeowner_id: 'demo-owner-001',
    title: 'Concrete Driveway and Patio',
    category: 'Concrete Works',
    description: 'Need 1,000 sq ft driveway plus 300 sq ft back patio poured. Includes excavation, formwork, reinforcement mesh, and brushed finish.',
    region: 'Region 4',
    location: 'Georgetown',
    budget_min: 400000,
    budget_max: 600000,
    status: 'open',
    created_at: '2026-06-25T00:00:00Z',
  },
  {
    id: 'demo-job-4',
    homeowner_id: 'demo-owner-001',
    title: 'Roof Replacement — Leaking Zinc Sheets',
    category: 'Roofing',
    description: 'Existing zinc sheet roof on a 3-bedroom house needs complete replacement. Multiple leaks during rainy season.',
    region: 'Region 5',
    location: 'Rosignol',
    budget_min: 180000,
    budget_max: 300000,
    status: 'open',
    created_at: '2026-06-27T00:00:00Z',
  },
  {
    id: 'demo-job-5',
    homeowner_id: 'demo-owner-001',
    title: 'Chain-Link Fence — 200ft Perimeter',
    category: 'Fencing & Gates',
    description: 'Need 200 linear feet of 6ft chain-link fence with one double gate and one pedestrian gate.',
    region: 'Region 4',
    location: 'Diamond',
    budget_min: 120000,
    budget_max: 200000,
    status: 'open',
    created_at: '2026-06-29T00:00:00Z',
  },
  {
    id: 'demo-job-6',
    homeowner_id: 'demo-owner-001',
    title: 'Land Clearing — 3 Acre Bush Lot',
    category: 'Land Clearing',
    description: 'Need 3 acres of heavy bush cleared and graded for agricultural use. Thick vegetation, some medium trees.',
    region: 'Region 3',
    location: 'Parika',
    budget_min: 400000,
    budget_max: 700000,
    status: 'open',
    created_at: '2026-06-26T00:00:00Z',
  },
  {
    id: 'demo-job-7',
    homeowner_id: 'demo-owner-001',
    title: 'Construction Cost Consulting — 3-Bedroom House',
    category: 'Consultant',
    description: 'Need a construction consultant to provide cost estimation and project feasibility for a 3-bedroom concrete house build in Georgetown.',
    region: 'Region 4',
    location: 'Georgetown',
    budget_min: 50000,
    budget_max: 150000,
    status: 'open',
    created_at: '2026-06-24T00:00:00Z',
  },
];

export const DEMO_LEADS: DemoLead[] = [
  {
    id: 'demo-lead-1',
    job_id: 'demo-job-3',
    job_title: 'Concrete Driveway and Patio',
    job_category: 'Concrete Works',
    job_region: 'Region 4',
    unlocked_at: '2026-07-01T10:30:00Z',
    cost_credits: 0,
    homeowner_phone: '5926123456',
    status: 'approved',
  },
  {
    id: 'demo-lead-2',
    job_id: 'demo-job-5',
    job_title: 'Chain-Link Fence — 200ft Perimeter',
    job_category: 'Fencing & Gates',
    job_region: 'Region 4',
    unlocked_at: '2026-07-02T14:15:00Z',
    cost_credits: 0,
    homeowner_phone: '5926234567',
    status: 'requested',
  },
];

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: 'demo-tx-1',
    type: 'top_up',
    amount: 50,
    description: 'Demo Starter Pack — 50 Credits',
    created_at: '2026-07-01T09:00:00Z',
  },
  {
    id: 'demo-tx-2',
    type: 'quote_request',
    amount: 0,
    description: 'Quote Request — Concrete Driveway and Patio',
    created_at: '2026-07-01T10:30:00Z',
  },
  {
    id: 'demo-tx-3',
    type: 'quote_request',
    amount: 0,
    description: 'Quote Request — Chain-Link Fence',
    created_at: '2026-07-02T14:15:00Z',
  },
];

export const DEMO_POST_JOB_FORM = {
  title: 'Build 50ft Chainlink Fence in New Amsterdam',
  category: 'Fences & Gates',
  region: 'Region 6',
  location: 'New Amsterdam',
  description: 'Need a reliable mason to build a 50ft chainlink fence with concrete posts. Site is already cleared.',
  budgetSize: 'medium' as const,
  whatsapp: '5926XX-XXXX',
  placeholderImage: 'https://readdy.ai/api/search-image?query=Chainlink%20fence%20installation%20in%20progress%20at%20a%20Caribbean%20residential%20property%2C%20concrete%20posts%20being%20set%2C%20rolled%20chainlink%20mesh%20nearby%2C%20warm%20tropical%20daylight%2C%20palm%20trees%20in%20background%2C%20red%20clay%20soil%2C%20construction%20documentary%20photography%20with%20warm%20earthy%20tones&width=800&height=600&seq=demo-job-fence-01&orientation=landscape',
};

// Project Guardian demo milestones — tied to DEMO_JOBS[0] ("New House Build — 2 Bedroom Concrete")
export const DEMO_MILESTONES: DemoMilestone[] = [
  {
    id: 'demo-ms-1',
    job_id: 'demo-job-1',
    title: 'Foundation & Slab',
    description: 'Footings dug, steel tied, and concrete slab poured and cured.',
    status: 'approved',
    payment_certificate: true,
    updated_at: '2026-07-10T14:00:00Z',
  },
  {
    id: 'demo-ms-2',
    job_id: 'demo-job-1',
    title: 'Walls & Columns',
    description: 'Concrete block walls raised and columns formed and cast.',
    status: 'photo_submitted',
    payment_certificate: false,
    updated_at: '2026-07-18T09:30:00Z',
  },
  {
    id: 'demo-ms-3',
    job_id: 'demo-job-1',
    title: 'Roof Structure & Sheeting',
    description: 'Roof frame erected, purlins fixed, and zinc sheets installed.',
    status: 'not_started',
    payment_certificate: false,
    updated_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'demo-ms-4',
    job_id: 'demo-job-1',
    title: 'Finishing & Handover',
    description: 'Plumbing, electrical, painting, and final clean-up before handover.',
    status: 'not_started',
    payment_certificate: false,
    updated_at: '2026-07-01T00:00:00Z',
  },
];

export function getLeadCostCredits(budgetMin: number, budgetMax: number): number {
  const maxBudget = budgetMax || budgetMin || 0;
  if (maxBudget >= 2000000) return 5;
  if (maxBudget >= 300000) return 3;
  return 1;
}