# Project Context: BuildGuyana.gy

## Overview
BuildGuyana is a dual-sided marketplace connecting Project Owners (homeowners) with verified Tradespeople (contractors) across Guyana. The platform emphasizes trust, verification, and secure milestone-based payments via the "Project Guardian" workflow.

**Current Version:** v1.1.0

## Tech Stack
- **Frontend:** React 18+, Vite, TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (Custom design system in `tailwind.config.ts`)
- **Routing:** React Router v6 (`src/router/config.tsx`)
- **Backend/Database/Auth:** Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **Storage:** Cloudinary (for image/document uploads)
- **Email:** Resend (via Supabase SMTP)
- **Linting:** ESLint (Custom rules in `eslint-rules/`)

## Project Structure
- `src/components/feature/`: Core UI components (Navbar, Footer, AuthGuard, WhatsAppPopup).
- `src/pages/`: Route-level components organized by feature (auth, dashboard, jobs, contractors, control-panel).
- `src/contexts/`: Global state management (AuthContext, DemoModeContext, PlatformSettingsContext).
- `src/lib/`: Utilities, Supabase client initialization, Cloudinary helpers.
- `src/services/`: Business logic and API wrappers (e.g., verificationApi.ts, adminLog.ts).
- `src/mocks/`: Mock data for development and demo modes.
- `supabase/functions/`: Supabase Edge Functions (e.g., invite-user).

## Core Business Logic & Architecture

### 1. Dual-Role System
Users can be both Project Owners and Tradespeople. 
- **Crucial:** Roles are determined by boolean flags in the `profiles` table (`is_tradesperson`, `is_project_owner`), NOT just the legacy `role` string.
- Always use `AuthContext` to check roles. Do not hardcode role checks.

### 2. The "Project Guardian" Workflow (Milestones)
- When a quote is accepted, a `project_agreements` row is created, and 3 milestones are auto-generated (30% Deposit, 40% Progress, 30% Completion).
- Payments are off-platform (MMG/Bank). The app tracks the "Digital Handshake": Approve -> Mark Paid -> Confirm Receipt.
- Confirming receipt awards "Reliable Payer" and "Trustworthy Pro" reputation points.

### 3. Wallet & Credits System
- Tradespeople use credits to submit quotes.
- **Rule:** Balances can NEVER be negative. Enforced by DB constraint `CHECK (balance_credits >= 0)`.
- Top-ups are manual (MMG transfer) and require Admin approval in the Control Panel.
- All wallet movements are logged in `wallet_transactions` with specific `transaction_type` values (`top_up`, `quote_submission`, `refund`, `admin_adjustment`).

### 4. Verification & Badges
- 3-Tier Badge System: Verified ID, Business Registered, Licensed Professional.
- Regulated trades (Electrical, Plumbing) require Trade License verification.
- Documents are uploaded to Cloudinary and tracked in the `contractors` table (`doc_*` columns).

## Database Schema Highlights (Supabase)
- `profiles`: User data, role booleans, reputation points.
- `contractors`: Tradesperson specific data, verification statuses, document URLs, tier, payout details.
- `jobs`: Posted by Project Owners.
- `quotes`: Submitted by Tradespeople (costs credits).
- `project_agreements`: Links a hired job to a specific quote.
- `milestones`: Tracks the 3-phase payment workflow.
- `wallet_transactions`: Ledger for all credit movements.
- `notifications`: System and user alerts.

## Strict Rules for AI Agent

1. **Security & Environment:**
   - **NEVER** hardcode Supabase URLs, API keys, or Cloudinary secrets. Always use `import.meta.env`.
   - Respect Row Level Security (RLS). Assume the database will reject unauthorized writes.

2. **TypeScript & Code Quality:**
   - Write strict TypeScript. Avoid `any` whenever possible. Define interfaces for database rows and component props.
   - Use existing utility functions in `src/lib/` (e.g., `supabase` client, `uploadToCloudinary`).

3. **UI & Styling:**
   - Use Tailwind CSS exclusively. Follow the existing design system (colors like `primary-500`, `background-50`, `foreground-900`).
   - Reuse components from `src/components/feature/` (Navbar, Footer) on all public and dashboard pages.

4. **State Management:**
   - Use `AuthContext` for user data and roles.
   - Use `DemoModeContext` for demo-specific logic. Do not mix demo logic with production logic without checking `isDemo`.

5. **Error Handling:**
   - Wrap Supabase calls in `try/catch` blocks.
   - For background polling (like notifications), fail silently (`// silently fail`).
   - For user actions (like submitting a quote), show clear Toast notifications for success or failure.

6. **Routing:**
   - If creating a new page, it MUST be registered in `src/router/config.tsx`.
   - Protected routes must use the `AuthGuard` component.

7. **Data Integrity:**
   - When inserting into `wallet_transactions`, ensure the payload matches the schema exactly (e.g., negative amounts for deductions, correct `transaction_type`).
   - Do not use `.upsert()` for transaction ledgers; always use `.insert()` to create a new historical row.
