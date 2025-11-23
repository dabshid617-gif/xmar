-- POS sessions and payment methods (Odoo-like foundations)
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_cash NUMERIC(12,2) DEFAULT 0,
  closing_cash NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'open', -- open|closed
  notes TEXT
);

ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pos_sessions' AND policyname='Owner can manage own pos sessions'
  ) THEN
    CREATE POLICY "Owner can manage own pos sessions" ON public.pos_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.pos_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  requires_reference BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO public.pos_payment_methods (code, name)
VALUES ('cash','Cash'),('evc_plus','EVC Plus'),('zaad','ZAAD'),('waffi','WAFFI'),('edahab','E-DAHAB')
ON CONFLICT (code) DO NOTHING;

-- Optional foreign keys on payments to relate with session/method (non-breaking)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.pos_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS method_id UUID REFERENCES public.pos_payment_methods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pos_sessions_user_status ON public.pos_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_session ON public.payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(method_id);

