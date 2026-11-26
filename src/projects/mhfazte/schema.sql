-- ══════════════════════════════════════════
-- Platform Users & Permissions Tables
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS platform_users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  name       text,
  avatar_url text,
  is_admin   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all"   ON platform_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own" ON platform_users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own" ON platform_users FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "admin update all" ON platform_users FOR UPDATE TO authenticated
  USING (EXISTS(SELECT 1 FROM platform_users WHERE id = auth.uid() AND is_admin = true));

-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_permissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES platform_users(id) ON DELETE CASCADE NOT NULL,
  project_slug text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, project_slug)
);

ALTER TABLE platform_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or admin" ON platform_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR
         EXISTS(SELECT 1 FROM platform_users WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "admin write" ON platform_permissions FOR ALL TO authenticated
  USING  (EXISTS(SELECT 1 FROM platform_users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS(SELECT 1 FROM platform_users WHERE id = auth.uid() AND is_admin = true));
