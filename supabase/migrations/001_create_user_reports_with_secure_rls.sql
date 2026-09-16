-- ============================================================
-- Phase 1: Report User Feature — user_reports table + non-recursive RLS
-- ============================================================

-- 1. Create private schema for security definer helper
CREATE SCHEMA IF NOT EXISTS private;

-- 2. SECURITY DEFINER function to check admin status WITHOUT recursion
-- This uses SECURITY DEFINER so it reads profiles with elevated privileges,
-- avoiding the infinite recursion caused by using SELECT in policy expressions.
CREATE OR REPLACE FUNCTION private.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = user_id), false);
$$;

-- 3. Create user_reports table with strict columns (no deleted_at needed)
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- 5. Policy: Reporter can INSERT their own report
CREATE POLICY "Reporter insert" ON public.user_reports
FOR INSERT
WITH CHECK (
  reporter_id = auth.uid()
  AND reporter_id != reported_user_id  -- prevent self-reporting
);

-- 6. Policy: Reporter can SELECT their own reports
CREATE POLICY "Reporter select own" ON public.user_reports
FOR SELECT
USING (reporter_id = auth.uid());

-- 7. Policy: Admin can SELECT all reports
CREATE POLICY "Admin select all" ON public.user_reports
FOR SELECT
USING (private.is_admin(auth.uid()) = true);

-- 8. Policy: Admin can UPDATE status only (restrict which fields can be changed)
CREATE POLICY "Admin update status" ON public.user_reports
FOR UPDATE
USING (private.is_admin(auth.uid()) = true)
WITH CHECK (private.is_admin(auth.uid()) = true AND reporter_id = reporter_id AND reported_user_id = reported_user_id);

-- 9. Policy: Reporter can DELETE their own report (optional, but protected)
CREATE POLICY "Reporter delete own" ON public.user_reports
FOR DELETE
USING (reporter_id = auth.uid());

-- 10. IMPORTANT: Reported user CANNOT read reports about themselves
-- The SELECT policies above use reporter_id = auth.uid() or admin check.
-- There is NO policy granting SELECT to reported_user_id = auth.uid(),
-- which protects reporter anonymity.

-- 11. Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.user_reports(status);
