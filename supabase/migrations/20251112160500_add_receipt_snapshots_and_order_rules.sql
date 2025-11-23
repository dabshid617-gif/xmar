-- Immutable receipt snapshots and order lifecycle rules
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

-- Store snapshot of rendered receipt JSON at time of order
CREATE TABLE IF NOT EXISTS public.receipt_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.receipt_snapshots ENABLE ROW LEVEL SECURITY;
-- Owner (seller) or buyer can view their snapshots
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='receipt_snapshots' AND policyname='Snapshots visible to participants') THEN
    CREATE POLICY "Snapshots visible to participants" ON public.receipt_snapshots
      FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = customer_id);
  END IF;
END $$;

-- Orders lifecycle: statuses and transitions
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  -- Ensure status only from allowed set
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'orders_status_allowed') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_allowed CHECK (status IN ('pending','completed','refunded','void'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_order_rules()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  total_pay NUMERIC;
BEGIN
  -- Maintain updated_at
  NEW.updated_at := NOW();

  -- Enforce allowed transitions
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;
    -- Allowed: pending -> completed|void; completed -> refunded; pending -> refunded (edge) not allowed
    IF OLD.status = 'pending' AND NEW.status IN ('completed','void') THEN
      NULL; -- ok
    ELSIF OLD.status = 'completed' AND NEW.status = 'refunded' THEN
      NULL; -- ok
    ELSE
      RAISE EXCEPTION 'Invalid order status transition: % -> %', OLD.status, NEW.status;
    END IF;

    -- When moving to completed, ensure payments sum meets total
    IF NEW.status = 'completed' THEN
      SELECT COALESCE(SUM(amount),0) INTO total_pay FROM public.payments WHERE order_id = NEW.id;
      IF total_pay < NEW.total THEN
        RAISE EXCEPTION 'Payments (%) do not cover order total (%)', total_pay, NEW.total;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_rules ON public.orders;
CREATE TRIGGER trg_enforce_order_rules
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_rules();
