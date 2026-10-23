-- PoultryOps: order payments and partial fulfilment foundation
-- Schema-only migration. Does not rewrite existing transactions or sales.

BEGIN;

-- Proposed delivery date can be recorded without changing order status.
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS proposed_delivery_date date;

ALTER TABLE public.public_order_batches
    ADD COLUMN IF NOT EXISTS proposed_delivery_date date;

-- Records each actual fulfilment of an order line.
-- A single order line may have multiple fulfilment records.
CREATE TABLE public.order_fulfilments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    quantity integer NOT NULL CHECK (quantity > 0),
    fulfilled_at timestamptz NOT NULL DEFAULT now(),
    notes text,
    sale_id uuid REFERENCES public.sales(id) ON DELETE RESTRICT,
    idempotency_key uuid NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT order_fulfilments_idempotency_key_key
        UNIQUE (idempotency_key)
);

CREATE INDEX order_fulfilments_farm_order_idx
    ON public.order_fulfilments (farm_id, order_id, fulfilled_at);

CREATE INDEX order_fulfilments_sale_id_idx
    ON public.order_fulfilments (sale_id)
    WHERE sale_id IS NOT NULL;

-- Links a received payment to the order or public order batch it was
-- intended for. This is separate from allocations against completed sales.
CREATE TABLE public.order_payment_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    payment_id uuid NOT NULL
        REFERENCES public.customer_payments(id) ON DELETE RESTRICT,
    order_id uuid REFERENCES public.orders(id) ON DELETE RESTRICT,
    order_batch_id uuid
        REFERENCES public.public_order_batches(id) ON DELETE RESTRICT,
    amount numeric(14,2) NOT NULL CHECK (amount > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT order_payment_allocations_exactly_one_target
        CHECK (
            (order_id IS NOT NULL AND order_batch_id IS NULL)
            OR
            (order_id IS NULL AND order_batch_id IS NOT NULL)
        )
);

CREATE UNIQUE INDEX order_payment_allocations_payment_order_uidx
    ON public.order_payment_allocations (payment_id, order_id)
    WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX order_payment_allocations_payment_batch_uidx
    ON public.order_payment_allocations (payment_id, order_batch_id)
    WHERE order_batch_id IS NOT NULL;

CREATE INDEX order_payment_allocations_farm_order_idx
    ON public.order_payment_allocations (farm_id, order_id)
    WHERE order_id IS NOT NULL;

CREATE INDEX order_payment_allocations_farm_batch_idx
    ON public.order_payment_allocations (farm_id, order_batch_id)
    WHERE order_batch_id IS NOT NULL;

CREATE INDEX order_payment_allocations_payment_idx
    ON public.order_payment_allocations (payment_id);

-- Enable row-level security. Reads are limited to users associated with
-- the relevant farm. No direct INSERT/UPDATE/DELETE policies are added;
-- writes will be handled by validated database functions in a later step.
ALTER TABLE public.order_fulfilments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_fulfilments_select_farm
    ON public.order_fulfilments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.farm_id = order_fulfilments.farm_id
        )
        OR EXISTS (
            SELECT 1
            FROM public.farm_users fu
            WHERE fu.user_id = auth.uid()
              AND fu.farm_id = order_fulfilments.farm_id
              AND fu.status = 'active'
        )
    );

CREATE POLICY order_payment_allocations_select_farm
    ON public.order_payment_allocations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.farm_id = order_payment_allocations.farm_id
        )
        OR EXISTS (
            SELECT 1
            FROM public.farm_users fu
            WHERE fu.user_id = auth.uid()
              AND fu.farm_id = order_payment_allocations.farm_id
              AND fu.status = 'active'
        )
    );

COMMENT ON TABLE public.order_fulfilments IS
    'Actual quantities supplied against order lines; supports partial fulfilment.';

COMMENT ON TABLE public.order_payment_allocations IS
    'Traceability of received payments to their intended order or order batch.';

COMMIT;
