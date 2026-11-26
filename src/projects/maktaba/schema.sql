-- ══════════════════════════════════════════
-- نظام المكتبة — Supabase Schema
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS maktaba_settings (
  id         int PRIMARY KEY DEFAULT 1,
  store_name text DEFAULT 'مكتبتي',
  phone      text DEFAULT '',
  address    text DEFAULT '',
  vat_num    text DEFAULT '',
  vat_pct    numeric DEFAULT 15,
  min_stock  int DEFAULT 5,
  currency   text DEFAULT 'SAR'
);
INSERT INTO maktaba_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS maktaba_categories (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maktaba_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         text,
  name        text NOT NULL,
  barcode     text,
  category_id uuid REFERENCES maktaba_categories(id) ON DELETE SET NULL,
  author      text,
  qty         numeric DEFAULT 0,
  min_stock   int DEFAULT 5,
  cost        numeric DEFAULT 0,
  price       numeric DEFAULT 0,
  description text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maktaba_customers (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL,
  phone   text,
  address text,
  created_at timestamptz DEFAULT now()
);
INSERT INTO maktaba_customers (name, phone) VALUES ('عميل نقدي عام', '') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS maktaba_suppliers (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL,
  phone   text,
  address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maktaba_invoices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  num          text NOT NULL,
  type         text NOT NULL CHECK (type IN ('sale','purchase')),
  party_id     uuid,
  party_name   text,
  date         date DEFAULT current_date,
  payment_type text DEFAULT 'cash',
  subtotal     numeric DEFAULT 0,
  disc_pct     numeric DEFAULT 0,
  disc_amt     numeric DEFAULT 0,
  vat_pct      numeric DEFAULT 0,
  vat_amt      numeric DEFAULT 0,
  net_total    numeric DEFAULT 0,
  cost_total   numeric DEFAULT 0,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maktaba_invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid REFERENCES maktaba_invoices(id) ON DELETE CASCADE NOT NULL,
  product_id  uuid REFERENCES maktaba_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  qty         numeric NOT NULL,
  price       numeric NOT NULL,
  cost        numeric DEFAULT 0,
  total       numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS maktaba_expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount      numeric NOT NULL,
  category    text,
  date        date DEFAULT current_date,
  created_at  timestamptz DEFAULT now()
);

-- RLS: shared access for all authenticated users
ALTER TABLE maktaba_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE maktaba_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE maktaba_products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE maktaba_customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE maktaba_suppliers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE maktaba_invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE maktaba_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maktaba_expenses      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared" ON maktaba_settings      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared" ON maktaba_categories    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared" ON maktaba_products      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared" ON maktaba_customers     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared" ON maktaba_suppliers     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared" ON maktaba_invoices      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared" ON maktaba_invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shared" ON maktaba_expenses      FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANT permissions
GRANT ALL ON maktaba_settings      TO authenticated;
GRANT ALL ON maktaba_categories    TO authenticated;
GRANT ALL ON maktaba_products      TO authenticated;
GRANT ALL ON maktaba_customers     TO authenticated;
GRANT ALL ON maktaba_suppliers     TO authenticated;
GRANT ALL ON maktaba_invoices      TO authenticated;
GRANT ALL ON maktaba_invoice_items TO authenticated;
GRANT ALL ON maktaba_expenses      TO authenticated;
