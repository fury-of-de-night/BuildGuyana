-- ============================================================
-- BuildGuyana — Complete RLS Security Policies
-- Run in Supabase SQL Editor (auth → disable RLS if needed, then re-enable)
-- Generated for: profiles, jobs, quotes, notifications, reports, wallet_transactions, etc.
-- ============================================================

-- ============================================================
-- 1) PROFILES (dual-role: is_project_owner, is_tradesperson, is_admin)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users own profile" ON profiles
FOR ALL USING (auth.uid() = id);

-- Admin can read/update any profile
CREATE POLICY "Admin full access profiles" ON profiles
FOR ALL USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- Public read: only verified/non-deleted profiles (optional for contractor directories)
CREATE POLICY "Public profile read" ON profiles
FOR SELECT USING (deleted_at IS NULL AND is_tradesperson = true);

-- ============================================================
-- 2) CONTRACTORS (linked to profiles via profile_id)
-- ============================================================
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- Contractor reads/write their own contractor record
CREATE POLICY "Contractor own record" ON contractors
FOR ALL USING (
  profile_id = (SELECT id FROM profiles WHERE id = auth.uid())
);

-- Admin full access
CREATE POLICY "Admin full access contractors" ON contractors
FOR ALL USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- Public read verified contractors (for directory/search)
CREATE POLICY "Public verified contractors" ON contractors
FOR SELECT USING (verification_status = 'verified' AND deleted_at IS NULL);

-- ============================================================
-- 3) JOBS (public listings + owner edits)
-- ============================================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Project owner reads/writes their own jobs
CREATE POLICY "Project owner jobs" ON jobs
FOR ALL USING (
  owner_id = auth.uid()
);

-- Public read open jobs
CREATE POLICY "Public open jobs" ON jobs
FOR SELECT USING (status = 'open');

-- Admin full access
CREATE POLICY "Admin jobs" ON jobs
FOR ALL USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- ============================================================
-- 4) QUOTES (contractor submits; owner reads)
-- ============================================================
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Contractor who created quote can read/update
CREATE POLICY "Contractor quote access" ON quotes
FOR ALL USING (
  contractor_id = (SELECT id FROM profiles WHERE id = auth.uid() AND is_tradesperson = true)
);

-- Job owner can read quotes for their job
CREATE POLICY "Job owner quote read" ON quotes
FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = quotes.job_id AND jobs.owner_id = auth.uid())
);

-- Admin full access
CREATE POLICY "Admin quotes" ON quotes
FOR ALL USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- ============================================================
-- 5) NOTIFICATIONS (user-specific + broadcast)
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User reads their own notifications
CREATE POLICY "Own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid() OR is_broadcast = true);

-- User updates (marks read) only their own
CREATE POLICY "Update own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin notifications" ON notifications
FOR ALL USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- ============================================================
-- 6) REPORTS / USER_REPORTS (reporter + reported_user)
-- ============================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Reporter can read/update their own reports
CREATE POLICY "Reporter reports" ON reports
FOR ALL USING (reporter_id = auth.uid());

-- Reported user and admin can read
CREATE POLICY "Reported/admin reports read" ON reports
FOR SELECT USING (
  reported_user_id = auth.uid()
  OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- ============================================================
-- 7) WALLET_TRANSACTIONS (financial — strict)
-- ============================================================
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- User can only read transactions linked to their profile
CREATE POLICY "Own wallet transactions" ON wallet_transactions
FOR SELECT USING (user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin wallet transactions" ON wallet_transactions
FOR ALL USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- ============================================================
-- 8) ADMIN_ACCESS_LOGS (admin-only)
-- ============================================================
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Admin only
CREATE POLICY "Admin access logs" ON admin_access_logs
FOR SELECT USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- ============================================================
-- 9) PLATFORM_SETTINGS (admin-only read; public read for some keys)
-- ============================================================
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Public read for non-sensitive settings (optional)
CREATE POLICY "Public settings read" ON platform_settings
FOR SELECT USING (key IN ('stat_regions', 'stat_rating', 'hide_mock_testimonials', 'show_tnc_on_startup', 'tnc_text'));

-- Admin full access
CREATE POLICY "Admin settings" ON platform_settings
FOR ALL USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- ============================================================
-- 10) REVIEWS / TESTIMONIALS / SUCCESS_STORIES / BADGES
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Admin reviews" ON reviews FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public testimonials" ON testimonials FOR SELECT USING (is_mock_data = false);
CREATE POLICY "Admin testimonials" ON testimonials FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public success stories" ON success_stories FOR SELECT USING (is_mock_data = false);
CREATE POLICY "Admin success stories" ON success_stories FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Admin badges" ON badges FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- ============================================================
-- 11) SHORTLISTS / LEADS / LEAD_DISPUTES / PROJECT_AGREEMENTS
-- ============================================================
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shortlists" ON shortlists FOR ALL USING (homeowner_id = auth.uid());
CREATE POLICY "Admin shortlists" ON shortlists FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own leads" ON leads FOR SELECT USING (contractor_id = (SELECT profile_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admin leads" ON leads FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

ALTER TABLE lead_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own disputes" ON lead_disputes FOR SELECT USING (reporter_id = auth.uid() OR reported_id = auth.uid());
CREATE POLICY "Admin disputes" ON lead_disputes FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

ALTER TABLE project_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Party agreement access" ON project_agreements FOR SELECT USING (homeowner_id = auth.uid() OR contractor_id = (SELECT profile_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admin agreements" ON project_agreements FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- ============================================================
-- 12) MILESTONES / QUOTES / JOB_APPLICATIONS
-- ============================================================
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project milestone access" ON milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = milestones.job_id AND (
    jobs.owner_id = auth.uid() OR jobs.contractor_id = (SELECT profile_id FROM profiles WHERE id = auth.uid())
  ))
);
CREATE POLICY "Admin milestones" ON milestones FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own applications" ON job_applications FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Job owner applications" ON job_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_applications.job_id AND jobs.owner_id = auth.uid())
);
CREATE POLICY "Admin applications" ON job_applications FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- ============================================================
-- 13) CONTRACTOR_WALLET / CATEGORY_CONTRACTOR_COUNTS / CONTRACTOR_STATS
-- ============================================================
ALTER TABLE contractor_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wallet" ON contractor_wallet FOR SELECT USING (contractor_id = (SELECT profile_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admin wallet" ON contractor_wallet FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

ALTER TABLE category_contractor_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public counts" ON category_contractor_counts FOR SELECT USING (true);

ALTER TABLE contractor_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public stats" ON contractor_stats FOR SELECT USING (true);
CREATE POLICY "Admin stats" ON contractor_stats FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- ============================================================
-- 14) VERIFICATIONS (user uploads docs)
-- ============================================================
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own verifications" ON verifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin verifications" ON verifications FOR ALL USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- ============================================================
-- END — After running, verify in Supabase Dashboard > Auth > Policies
-- ============================================================
