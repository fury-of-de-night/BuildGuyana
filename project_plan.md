# BuildGuyana.gy — Guyana's Nationwide Construction Marketplace

## 1. Project Description
BuildGuyana.gy connects homeowners and businesses across ALL 10 Administrative Regions of Guyana with verified local contractors for construction and infrastructure work. The platform serves Guyana's booming construction sector: house construction, fences, culverts, drains, concrete yards, roofing, welding, land clearing, machinery rental, and material supply.

**Launch Strategy:** NATIONWIDE across all 10 Administrative Regions immediately, with smart fallback UI for regions where we don't have contractors yet.

**Target users:**
- Homeowners and businesses across Guyana needing construction, fencing, drainage, concrete work
- Local contractors and tradespeople seeking lead generation in all 10 regions
- Material suppliers and machinery rental operators nationwide

**Empty Region Strategy:**
- Regions without contractors yet (e.g. Region 8, 9, 10 at launch) show a friendly expansion banner
- Banner includes "Sign up as a contractor" CTA and "Notify me" email subscription
- Below the banner, show top-rated contractors from nearby/active regions to prove the platform works
- This prevents dead-end pages and builds trust while we expand

**Core Business Model:**
- Homeowners post jobs for FREE
- Contractors view available jobs for FREE
- Contractors pay per lead unlock (deducted from their wallet balance in GYD)
- When a lead is unlocked, a WhatsApp Click-to-Chat link is generated — NO internal messaging system
- Admin dashboard approves/rejects contractor verification documents

## 2. Page Structure
- `/` — Home (hero, categories, how it works, featured contractors, testimonials, CTA)
- `/how-it-works` — Process explanation for homeowners and contractors
- `/contractors` — Browse contractors by category, region/location, rating — includes empty-region fallback UI
- `/contractors/:id` — Contractor profile with reviews, portfolio (max 10 images), Facebook page link
- `/post-job` — Homeowner job posting form with all 10 regions in location selector
- `/login` — Login (supports both roles)
- `/register` — Registration with role selection (Homeowner vs Contractor) + region selector
- `/dashboard/homeowner` — Homeowner dashboard (my posted jobs, unlocked leads)
- `/dashboard/contractor` — Contractor dashboard (wallet, available jobs feed, lead unlock with WhatsApp)
- `/dashboard/admin` — Admin dashboard (approve/reject contractor verification documents)

## 3. Core Features
- [ ] User authentication (homeowner + contractor roles)
- [ ] Nationwide job posting with all 10 Guyana Administrative Regions
- [ ] Browse contractors with filters (category, region/location, rating)
- [ ] Empty-region fallback UI for areas without contractors yet
- [ ] Contractor profiles with reviews, portfolio (max 10 images), and Facebook page link
- [ ] Wallet system: contractors top up wallet (mocked WiPay/MMG), leads deduct from balance
- [ ] WhatsApp Click-to-Chat lead unlocking (NO internal messaging)
- [ ] Review and rating system after job completion
- [ ] Badge system with 6-month auto-expiry tracking
- [ ] Admin verification workflow (approve/reject contractor documents)

## 4. Data Model Design

### Table: profiles
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key, links to auth.users |
| role | text | 'homeowner' or 'contractor' |
| full_name | text | Display name |
| phone | text | Contact number (format: 592XXXXXXXX) |
| region | text | Administrative Region (Region 1-10) |
| location | text | City/town in Guyana |
| avatar_url | text | Profile photo |
| created_at | timestamp | Registration date |

### Table: contractors
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | FK to profiles |
| category | text | Primary trade category (from 10 BuildGuyana.gy categories) |
| categories | text[] | All trade categories they serve |
| region | text | Administrative Region where they operate |
| bio | text | Business description |
| years_experience | int | Years in trade |
| verified | boolean | Admin verified (document check) |
| portfolio_images | text[] | Work photos (STRICT max 10 — enforced via DB constraint + frontend limit) |
| facebook_page_url | text | Contractor's Facebook business page URL |
| rating | decimal | Average rating |
| review_count | int | Total reviews |
| badge_id | uuid | FK to current active badge (nullable) |
| trade_license_status | text | Trade license verification status ('pending'/'approved'/'rejected') for regulated trades (Electrical Work, Plumbing) |
| trade_license_number | text | Trade license number for regulated trades |
| trade_license_doc_url | text | Uploaded trade license document URL |

### Table: contractor_wallet
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| contractor_id | uuid | FK to contractors |
| balance | int | Current balance in GYD |
| created_at | timestamp | Wallet creation date |
| updated_at | timestamp | Last balance change |

### Table: wallet_transactions
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| wallet_id | uuid | FK to contractor_wallet |
| type | text | 'top_up' or 'lead_unlock' or 'refund' |
| amount | int | Amount in GYD |
| description | text | e.g. 'WiPay Top Up - $5,000 GYD' or 'Lead Unlock - Job #123' |
| created_at | timestamp | Transaction date |

### Table: badges
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| contractor_id | uuid | FK to contractors |
| badge_type | text | 'verified', 'top_rated', 'premium' |
| awarded_at | timestamp | When badge was awarded |
| badge_expiry_date | timestamp | When badge expires (6 months from award) |
| review_count_last_6_months | int | Rolling review count for automated expiry logic |

### Table: jobs
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| homeowner_id | uuid | FK to profiles |
| title | text | Job title |
| category | text | From the 10 BuildGuyana.gy categories |
| description | text | Detailed description |
| region | text | Administrative Region (Region 1-10) |
| location | text | City/area in Guyana |
| budget_min | int | Budget range low (GYD) |
| budget_max | int | Budget range high (GYD) |
| status | text | 'open', 'in_progress', 'completed', 'cancelled' |
| created_at | timestamp | Posted date |

### Table: leads
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| job_id | uuid | FK to jobs |
| contractor_id | uuid | FK to contractors |
| unlocked_at | timestamp | When lead was unlocked |
| cost_gyd | int | Cost deducted from wallet |
| homeowner_phone | text | Phone number shared with contractor (for WhatsApp) |

### Table: reviews
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| job_id | uuid | FK to jobs |
| reviewer_id | uuid | FK to profiles (homeowner) |
| contractor_id | uuid | FK to contractors |
| rating | int | 1-5 stars |
| comment | text | Review text |
| created_at | timestamp | Review date |

## 5. Core Logic Rules

### Lead Unlocking (NO Internal Messaging)
When a contractor clicks "Unlock Lead" on a job:
1. System checks `contractor_wallet.balance` >= lead cost
2. Deducts cost from `contractor_wallet.balance`
3. Creates `wallet_transactions` record (type: 'lead_unlock')
4. Creates `leads` record with homeowner's phone
5. Generates WhatsApp Click-to-Chat link:
   `https://wa.me/592{HOMEOwner_PHONE}?text=Hi, I am {CONTRACTOR_NAME} from BuildGuyana.gy. I saw your job posting for {JOB_TITLE} and I'm interested in quoting. When can we discuss?`
6. Shows the WhatsApp link as a button in the UI — contractor clicks it to open WhatsApp

### WhatsApp Link Format
- Guyana country code: 592
- Phone numbers stored without leading symbols, just digits
- Pre-filled message template for quick first contact

### Wallet Top-Up
- Mocked payment flow simulating WiPay / MMG (Guyana's local payment processors)
- Contractor enters amount in GYD, clicks "Top Up"
- Mock confirmation screen, balance updates immediately
- Real payment integration can be added later via WiPay/MMG API

### Empty Region Fallback UI Logic
On the `/contractors` browse page when a region with zero contractors is selected:
1. Show banner: "We are currently expanding to [Region Name]! We don't have contractors in this area just yet."
2. Show two CTAs: "Are you a contractor in this area? Sign up here" + "Notify me when contractors arrive" email input
3. Below banner, show section: "Meanwhile, check out these Top-Rated Contractors available nationwide:"
4. Display 3-4 highly-rated mock contractors from active regions (e.g. Georgetown Region 4, Region 6)

### Badge Expiry (Automated)
- Badges awarded for 6 months (badge_expiry_date = awarded_at + 6 months)
- `review_count_last_6_months` tracks rolling 6-month review count
- When badge expires: if contractor has enough recent reviews, auto-renew; otherwise, demote
- Admin can manually override

### Portfolio Image Limit
- DB constraint limits portfolio_images array to max 10 elements
- Frontend upload cap enforces the same limit before submission
- Error shown if contractor tries to upload #11

## 6. Backend / Third-party Integration Plan
- **Supabase:** Auth, database, storage (portfolio images), Edge Functions for wallet logic
- **Shopify:** Not needed
- **Stripe:** Not needed (wallet top-up via WiPay/MMG in future)
- **WhatsApp API:** Via Click-to-Chat URL (no API key needed — just uses wa.me links)

## 7. Guyana Administrative Regions Reference

| Region | Name | Major Towns | Contractor Coverage |
|--------|------|-------------|---------------------|
| Region 1 | Barima-Waini | Mabaruma, Port Kaituma | Not yet |
| Region 2 | Pomeroon-Supenaam | Anna Regina, Charity | Not yet |
| Region 3 | Essequibo Islands-West Demerara | Vreed en Hoop, Parika | Active |
| Region 4 | Demerara-Mahaica | Georgetown, Diamond, Grove | Active (most contractors) |
| Region 5 | Mahaica-Berbice | Rosignol, Fort Wellington | Active |
| Region 6 | East Berbice-Corentyne | New Amsterdam, Corentyne | Active (launch region) |
| Region 7 | Cuyuni-Mazaruni | Bartica, Kamarang | Not yet |
| Region 8 | Potaro-Siparuni | Mahdia, Tumatumari | Not yet (empty for testing) |
| Region 9 | Upper Takutu-Upper Essequibo | Lethem, Aishalton | Not yet (empty for testing) |
| Region 10 | Upper Demerara-Berbice | Linden, Ituni, Kwakwani | Not yet (empty for testing) |

## 8. Development Phase Plan

### Phase 1: Homepage & Static Pages ✅ DONE
- Homepage with hero, 10 categories, how it works, featured contractors, testimonials, CTA
- Static `/how-it-works` page
- Nationwide positioning updated

### Phase 2: Contractors Browse + Empty Region UI ✅ DONE
- `/contractors` browse page with region filter and empty-region fallback UI

### Phase 3: Supabase, Auth, Dashboards, Admin ✅ DONE
- Supabase database setup with all 8 tables + RLS policies
- Cloudinary integration for image/document uploads
- Auth flow: Login/Register with Project Owner vs Tradesperson role selection
- Dual-role accounts (one email can be both Project Owner AND Tradesperson)
- Login role selection screen when user has both profiles
- Tradesperson registration: region selector, trade category, verification doc upload via Cloudinary
- AuthGuard + RoleGuard components for protected routes
- Tradesperson Dashboard: Wallet tab (mock top-up, Credits display, transaction history)
- Tradesperson Dashboard: Available Jobs tab (filter by region/category, lead unlock with WhatsApp)
- Tradesperson Dashboard: My Leads tab (unlocked leads with WhatsApp re-contact)
- Admin Dashboard: approve/reject tradesperson verification documents
- Badge creation on approval (6-month expiry)

### Phase 4: Credits Economy, Demo Mode, Post a Job ✅ DONE
- **Credits Economy**: 1 Credit = GYD $1,500. DB uses balance_credits (integer)
  - Lead fees: Small = 1 Credit, Medium = 2 Credits, Large = 5 Credits
  - Top-up packages: 10/50/100 Credits with GYD price shown secondary
  - Wallet UI shows Credits with coin icon
- **Demo Mode**: `/demo-tradesperson` and `/demo-project-owner` routes
  - No auth required, local mock data, yellow warning banner
  - Fake wallet (50 Credits), instant top-up, switch role button
  - Admin dashboard + verification uploads hidden in demo mode
- **Post a Job page** (`/post-job`): Full form with Cloudinary photo upload
  - Title, Category, Region, Description, Budget Size, Timeline, Phone
  - Inserts directly into Supabase jobs table

### Phase 5: Dynamic Homepage ✅ DONE
- Context-aware hero section changing based on auth state and role
- Not logged in: marketing hero with "Try Demo" button
- Logged in as Tradesperson: "Ready to find work?" + wallet stats
- Logged in as Project Owner: "What do you want to build today?" + "Post a New Job" CTA
- Navbar shows demo link (logged out), switch role button (dual profiles), balance indicator

### Phase 6: Contractor Profiles, Reviews, Database-First Architecture ✅ DONE
- **Database Views**: `contractor_stats`, `category_contractor_counts`, `region_contractor_counts`
- **`notifications` table**: bell icon in Navbar with unread badge, notification on lead unlock
- **`usePlatformSettings` hook**: dynamic `credit_to_gyd_rate` from `platform_settings`, no hardcoded rates
- **Supabase search**: contractors page and JobsTab use ilike queries
- **JobsTab**: search bar, category filter, "Show All Jobs" toggle
- **My Profile page** (`/profile`): edit name, phone, region, bio, avatar, portfolio (max 10) with Cloudinary upload
- **Registration**: optional profile photo upload during signup
- **Control Panel**: restore resets marketing stats to defaults (500, 2400, 4.8, 10)
- **Homepage stats**: fully dynamic from `platform_settings` via database triggers
- **Category counts**: dynamic from `category_contractor_counts` view

### Phase 7: Two-Step Quote Flow ✅ TODO
- **Two-Step Quote Flow (Phase 7)**: Contractors first "Request to Quote" (FREE), project owners approve/reject, then approved contractors submit paid quotes
  - New `job_applications` table with statuses: requested, approved, rejected, quote_submitted
  - ID verification: `doc_id_card`, `doc_passport`, `id_verification_status` on contractors table
  - Self-quote prevention: contractors cannot request quotes on their own jobs or own profile

### Phase 8: Notifications, Success Stories, Demo Cleanup, 3-Tier Badges ✅ DONE
- **Notifications page**: fetch user + broadcast notifications, mark-as-read on click, "Mark All as Read" with toast, live navbar unread badge via `notifications-updated` event
- **Success Stories page**: rebuilt against the `success_stories` table (before/after images, rating stars, testimonial quotes), respects `is_mock_data`
- **Testimonials section**: respects `is_mock_data` toggle and hides when empty
- **Role switching refactor**: navbar dashboard dropdown always shows Project Owner, shows Tradesperson only if eligible, "Become a Tradesperson" link otherwise
- **Demo mode cleanup**: Exit Demo / Reset Demo Data consolidated in navbar, demo role switching via navbar dropdown, pre-filled forms sourced from `src/mocks/demoData.ts`
- **Account management**: Cancel Subscription (TierTab) and Delete Account soft-delete (profile page)
- **3-Tier Badge System**: `trade_license_status` / `trade_license_number` / `trade_license_doc_url` columns added to contractors; Verified ID / Business Registered / Licensed Professional filters + profile badges; regulated-trade license verification on registration

### Phase 9: Project Guardian Strategy + Demo Parity (v98) ✅ DONE
- **Navbar demo role switch restored**: quick "Switch to Project Owner/Tradesperson Demo" button in both desktop and mobile demo controls (routes via `/dashboard/*` which the demo AuthGuard bypasses)
- **How It Works page rewritten for Project Guardian**: unified 4-step flow (Post & Get Matched with a 3-verified-pro cap → Review Quotes & Approve free requests → Project Guardian Milestones with WhatsApp photo proof + Payment Certificates → Build Reputation via Reliable Payer / Trustworthy Pro dual badges), plus a built-in protection band, tradesperson section, and updated value props
- **Demo pages synced to Project Guardian**:
  - Owner demo: milestone tracking UI (number rail, status badges, "Approve & Issue Certificate" action, Payment Certificate notes) backed by context state that persists across role switches
  - Tradesperson demo: new "Project Guardian" tab with "Submit Photo Proof via WhatsApp" flow, plus Elite tier chip and the full 3-tier badge row (Verified ID / Business Registered / Licensed Professional)
  - `DemoModeContext` now owns `demoMilestones` + `submitDemoMilestoneProof` / `approveDemoMilestone` actions with sessionStorage persistence and notifications
- **Mock data showcases tiers**: all 24 `tradespeople` mock entries now carry `tier` (elite/pro/basic/free) + `id_verification_status` / `doc_business_reg` / `trade_license_status` so badges and search filters have data; control-panel "Restore Mock Data" now seeds those fields into Supabase so the live browse page sorts Elite-first and filters work; EmptyRegionBanner fallback sorts by tier then rating; contractor profile mock branch renders the matching badges
- **ContractorProfile type** extended with `trade_license_status` / `trade_license_number` / `trade_license_doc_url`