# Graph Report - BuildGuyana  (2026-09-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 488 nodes · 642 edges · 51 communities (33 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2691094e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- contractor/page.tsx
- compilerOptions
- control-panel/page.tsx
- PlatformSettingsContext.tsx
- home/page.tsx
- compilerOptions
- devDependencies
- react
- config.tsx
- router/index.ts
- demoData.ts
- dependencies
- VerificationQueue.tsx
- dashboard/project-owner/page.tsx
- AuthContext.tsx
- database.types.ts
- contractors/profile/page.tsx
- DemoModeContext.tsx
- tradesperson/page.tsx
- verification/page.tsx
- public-jobs/page.tsx
- how-it-works/page.tsx
- post/page.tsx
- transaction-history/page.tsx
- verificationApi.ts
- locations.ts
- post-job/page.tsx
- quotes/page.tsx
- requests/page.tsx
- submit-quote/page.tsx
- milestoneReceipt.ts
- userDisplay.ts
- register/page.tsx
- admin/page.tsx
- notifications/page.tsx
- success-stories/page.tsx
- reviews/page.tsx
- cloudinary.ts
- categories.ts
- login/page.tsx
- invite-user/index.ts
- tsconfig.json
- constants.ts
- jobs.ts
- testimonials.ts
- tradespeople.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 53 edges
2. `react-router-dom` - 45 edges
3. `compilerOptions` - 28 edges
4. `compilerOptions` - 17 edges
5. `scripts` - 6 edges
6. `PublicJobsPage()` - 5 edges
7. `formatError()` - 5 edges
8. `create()` - 4 edges
9. `VerificationDetailModal()` - 4 edges
10. `VerificationQueue()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (51 total, 14 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.05
Nodes (34): autoImportGlobals, create(), name, private, scripts, build, dev, lint (+26 more)

### Community 1 - "contractor/page.tsx"
Cohesion: 0.07
Nodes (27): CATEGORIES, getLeadCostCredits(), Job, JobsTab(), JobsTabProps, DISPUTE_REASONS, getLeadCostCredits(), JobApplication (+19 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (29): compilerOptions, allowImportingTsExtensions, alwaysStrict, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+21 more)

### Community 3 - "control-panel/page.tsx"
Cohesion: 0.11
Nodes (18): file-saver, jszip, InviteUserTab(), Role, PendingTopUp, PendingTopUps(), ControlPanelPage(), CreditManagementTab() (+10 more)

### Community 4 - "PlatformSettingsContext.tsx"
Cohesion: 0.08
Nodes (10): DEFAULT_CONTACT, DEFAULT_SOCIAL, WhatsAppPopupProps, DemoContext, DemoContextValue, DemoRole, DEFAULT_SETTINGS, PlatformSettings (+2 more)

### Community 5 - "home/page.tsx"
Cohesion: 0.13
Nodes (13): CategoriesSection(), CategoryCount, CTASection(), FeaturedTradespeopleSection(), TradespersonCard, HeroSection(), contractorSteps, HowItWorksSection() (+5 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+10 more)

### Community 7 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jiti (+10 more)

### Community 8 - "react"
Cohesion: 0.17
Nodes (7): react, react-router-dom, AuthGuardProps, EmptyRegionBanner(), TradespersonCard, JobDetails, RequestQuotePage()

### Community 9 - "config.tsx"
Cohesion: 0.15
Nodes (9): Contractors(), DemoProjectOwnerPage(), NotFound(), PricingPage(), tiers, MyProfilePage(), PREDEFINED_MATERIALS, Testimonial (+1 more)

### Community 10 - "router/index.ts"
Cohesion: 0.18
Nodes (10): i18next, i18next-browser-languagedetector, react-i18next, App(), messages, modules, routes, AppRoutes() (+2 more)

### Community 11 - "demoData.ts"
Cohesion: 0.13
Nodes (13): DEMO_JOBS, DEMO_LEADS, DEMO_MILESTONES, DEMO_POST_JOB_FORM, DEMO_PROJECT_OWNER_PROFILE, DEMO_TRADESPERSON_CONTRACTOR, DEMO_TRADESPERSON_PROFILE, DEMO_TRANSACTIONS (+5 more)

### Community 12 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, file-saver, firebase, i18next, i18next-browser-languagedetector, jszip, lucide-react, react (+6 more)

### Community 13 - "VerificationQueue.tsx"
Cohesion: 0.21
Nodes (12): isValidHttpUrl(), normalizeStatus(), VerificationDetailModal(), VerificationDetailModalProps, VerificationDetailRecord, FILTER_TABS, FilterKey, getStatusInfo() (+4 more)

### Community 14 - "dashboard/project-owner/page.tsx"
Cohesion: 0.15
Nodes (11): Milestone, MilestoneGroup, MilestonesTab(), JobWithStats, LeadContractor, Notification, ProjectOwnerDashboardPage(), ShortlistedContractor (+3 more)

### Community 15 - "AuthContext.tsx"
Cohesion: 0.18
Nodes (9): @supabase/supabase-js, ActiveRole, AuthContext, AuthContextValue, AuthProvider(), ContractorProfile, determineRole(), Profile (+1 more)

### Community 16 - "database.types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 17 - "contractors/profile/page.tsx"
Cohesion: 0.22
Nodes (10): BADGE_STYLES, ContractorProfilePage(), FullProfile, GENERIC_PORTFOLIO, getMockPortfolio(), getMockReviews(), MOCK_PORTFOLIOS, MOCK_REVIEWS (+2 more)

### Community 18 - "DemoModeContext.tsx"
Cohesion: 0.24
Nodes (8): DemoContext, DemoContextValue, DemoNotification, DemoProvider(), DemoQuote, DemoRole, loadSaved(), makePrefilledNotifications()

### Community 19 - "tradesperson/page.tsx"
Cohesion: 0.22
Nodes (4): DemoTradespersonPage(), REGIONS, TabKey, TABS

### Community 20 - "verification/page.tsx"
Cohesion: 0.29
Nodes (5): DOC_ICONS, DOC_LABELS, DocKey, VerificationPage(), VerificationUser

### Community 21 - "public-jobs/page.tsx"
Cohesion: 0.43
Nodes (6): budgetSize(), formatGyd(), pickThumbnail(), PublicJob, PublicJobsPage(), STATUS_META

### Community 22 - "how-it-works/page.tsx"
Cohesion: 0.33
Nodes (5): guardianSteps, HowItWorks(), protectionPoints, tradespersonSteps, valueProps

### Community 23 - "post/page.tsx"
Cohesion: 0.33
Nodes (4): BUDGET_OPTIONS, BudgetSize, PostJobPage(), TIMELINE_OPTIONS

### Community 24 - "transaction-history/page.tsx"
Cohesion: 0.47
Nodes (5): formatAmount(), getTransactionDisplay(), Transaction, TransactionHistoryPage(), TransactionHistoryRoute()

### Community 27 - "post-job/page.tsx"
Cohesion: 0.40
Nodes (4): BUDGET_OPTIONS, BudgetSize, DemoPostJobPage(), TIMELINE_OPTIONS

### Community 28 - "quotes/page.tsx"
Cohesion: 0.40
Nodes (3): JobInfo, QuoteWithContractor, ReceivedQuotesPage()

### Community 29 - "requests/page.tsx"
Cohesion: 0.40
Nodes (3): ApplicationWithContractor, JobInfo, JobRequestsPage()

### Community 30 - "submit-quote/page.tsx"
Cohesion: 0.50
Nodes (4): getLeadCostCredits(), JobDetails, SubmitQuoteForm(), SubmitQuotePage()

### Community 31 - "milestoneReceipt.ts"
Cohesion: 0.67
Nodes (3): escapeHtml(), MilestoneReceiptData, openMilestoneReceipt()

### Community 33 - "register/page.tsx"
Cohesion: 0.50
Nodes (3): BusinessType, RegisterPage(), REGULATED_TRADES

### Community 36 - "success-stories/page.tsx"
Cohesion: 0.50
Nodes (3): MOCK_STORIES, Story, SuccessStoriesPage()

### Community 37 - "reviews/page.tsx"
Cohesion: 0.50
Nodes (3): ContractorInfo, Review, TradespersonReviewsPage()

## Knowledge Gaps
- **254 isolated node(s):** `Job`, `JobsTabProps`, `JobApplication`, `LeadsTabProps`, `QuoteWithJob` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 307 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `contractor/page.tsx`, `control-panel/page.tsx`, `PlatformSettingsContext.tsx`, `home/page.tsx`, `config.tsx`, `router/index.ts`, `VerificationQueue.tsx`, `dashboard/project-owner/page.tsx`, `AuthContext.tsx`, `contractors/profile/page.tsx`, `DemoModeContext.tsx`, `tradesperson/page.tsx`, `verification/page.tsx`, `public-jobs/page.tsx`, `post/page.tsx`, `transaction-history/page.tsx`, `post-job/page.tsx`, `quotes/page.tsx`, `requests/page.tsx`, `submit-quote/page.tsx`, `register/page.tsx`, `admin/page.tsx`, `notifications/page.tsx`, `success-stories/page.tsx`, `reviews/page.tsx`, `login/page.tsx`?**
  _High betweenness centrality (0.288) - this node is a cross-community bridge._
- **Why does `react-router-dom` connect `react` to `package.json`, `contractor/page.tsx`, `control-panel/page.tsx`, `PlatformSettingsContext.tsx`, `home/page.tsx`, `config.tsx`, `router/index.ts`, `dashboard/project-owner/page.tsx`, `contractors/profile/page.tsx`, `tradesperson/page.tsx`, `verification/page.tsx`, `public-jobs/page.tsx`, `how-it-works/page.tsx`, `post/page.tsx`, `transaction-history/page.tsx`, `post-job/page.tsx`, `quotes/page.tsx`, `requests/page.tsx`, `submit-quote/page.tsx`, `register/page.tsx`, `admin/page.tsx`, `notifications/page.tsx`, `success-stories/page.tsx`, `reviews/page.tsx`, `login/page.tsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `Job`, `JobsTabProps`, `JobApplication` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.054878048780487805 - nodes in this community are weakly interconnected._
- **Should `contractor/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07058823529411765 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._