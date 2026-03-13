-- Cron 실행 이력 (크론헬스 확인용)
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS cron_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL DEFAULT 'generate-reviews',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ok BOOLEAN NOT NULL DEFAULT false,
  msg TEXT,
  processed INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  results JSONB DEFAULT '[]',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_health_job_started ON cron_health(job_name, started_at DESC);
