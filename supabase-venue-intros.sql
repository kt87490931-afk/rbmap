-- 업체소개글 양식 저장 (폼 구조 기반)
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS venue_intros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  form_json JSONB NOT NULL DEFAULT '{}',
  ai_tone TEXT DEFAULT 'pro' CHECK (ai_tone IN ('pro', 'partner_pro')),
  period_days INTEGER DEFAULT 30,
  period_end DATE,
  contact_visible BOOLEAN DEFAULT true,
  intro_ai_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_intros_partner ON venue_intros(partner_id);
CREATE INDEX IF NOT EXISTS idx_venue_intros_period_end ON venue_intros(period_end);

ALTER TABLE venue_intros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venue_intros_service" ON venue_intros
  FOR ALL USING (auth.role() = 'service_role');
