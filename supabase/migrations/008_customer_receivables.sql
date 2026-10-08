-- ============================================================
-- PoultryOps Customer & Receivables Foundation
-- Migration 007
-- ============================================================

-- ============================================================
-- 1. CUSTOMERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    farm_id uuid NOT NULL
        REFERENCES public.farms(id)
        ON DELETE CASCADE,

    name text NOT NULL,
    phone text,
    address text,
    location text,

    notes text,

    active boolean NOT NULL DEFAULT true,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. CONNECT SALES TO CUSTOMERS
-- ============================================================

ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS customer_id uuid
    REFERENCES public.customers(id)
    ON DELETE SET NULL;


CREATE INDEX IF NOT EXISTS idx_sales_customer_id
    ON public.sales(customer_id);

CREATE INDEX IF NOT EXISTS idx_sales_farm_customer
    ON public.sales(farm_id, customer_id);


-- ============================================================
-- 3. CUSTOMER PAYMENTS
--
-- IMPORTANT:
-- This is completely separate from the existing `payments`
-- table used for PoultryOps subscription billing.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customer_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    farm_id uuid NOT NULL
        REFERENCES public.farms(id)
        ON DELETE CASCADE,

    customer_id uuid NOT NULL
        REFERENCES public.customers(id)
        ON DELETE CASCADE,

    amount numeric NOT NULL
        CHECK (amount > 0),

    payment_date date NOT NULL DEFAULT CURRENT_DATE,

    payment_method text,

    reference text,

    notes text,

    created_at timestamptz NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_customer_payments_customer
    ON public.customer_payments(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_payments_farm
    ON public.customer_payments(farm_id);

CREATE INDEX IF NOT EXISTS idx_customer_payments_date
    ON public.customer_payments(payment_date);


-- ============================================================
-- 4. PAYMENT ALLOCATION
--
-- Connects a customer payment to one or more sales.
--
-- Example:
--
-- Sale A       ₦100,000
-- Sale B        ₦50,000
--
-- Customer pays ₦120,000
--
-- Allocation:
-- Sale A       ₦100,000
-- Sale B        ₦20,000
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customer_payment_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    farm_id uuid NOT NULL
        REFERENCES public.farms(id)
        ON DELETE CASCADE,

    payment_id uuid NOT NULL
        REFERENCES public.customer_payments(id)
        ON DELETE CASCADE,

    sale_id uuid NOT NULL
        REFERENCES public.sales(id)
        ON DELETE CASCADE,

    amount numeric NOT NULL
        CHECK (amount > 0),

    created_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE(payment_id, sale_id)
);


CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment
    ON public.customer_payment_allocations(payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_sale
    ON public.customer_payment_allocations(sale_id);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_farm
    ON public.customer_payment_allocations(farm_id);


-- ============================================================
-- 5. CUSTOMER SALE BALANCE VIEW
--
-- Each sale shows:
--
-- Total
-- Amount paid
-- Outstanding
-- ============================================================

CREATE OR REPLACE VIEW public.customer_sale_balances
WITH (security_invoker = true)
AS
SELECT
    s.id AS sale_id,
    s.farm_id,
    s.customer_id,
    s.sale_date,
    s.item_type,
    s.quantity,
    s.unit_price,
    s.total_amount,

    COALESCE(
        SUM(cpa.amount),
        0
    ) AS amount_paid,

    GREATEST(
        s.total_amount -
        COALESCE(SUM(cpa.amount), 0),
        0
    ) AS outstanding_amount

FROM public.sales s

LEFT JOIN public.customer_payment_allocations cpa
    ON cpa.sale_id = s.id

WHERE s.customer_id IS NOT NULL

GROUP BY
    s.id,
    s.farm_id,
    s.customer_id,
    s.sale_date,
    s.item_type,
    s.quantity,
    s.unit_price,
    s.total_amount;


-- ============================================================
-- 6. CUSTOMER BALANCE VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.customer_balances
WITH (security_invoker = true)
AS
SELECT
    c.id AS customer_id,
    c.farm_id,
    c.name,
    c.phone,
    c.address,
    c.location,
    c.active,

    COALESCE(
        SUM(csb.total_amount),
        0
    ) AS total_sales,

    COALESCE(
        SUM(csb.amount_paid),
        0
    ) AS total_paid,

    COALESCE(
        SUM(csb.outstanding_amount),
        0
    ) AS outstanding_balance

FROM public.customers c

LEFT JOIN public.customer_sale_balances csb
    ON csb.customer_id = c.id

GROUP BY
    c.id,
    c.farm_id,
    c.name,
    c.phone,
    c.address,
    c.location,
    c.active;


-- ============================================================
-- 7. RLS — CUSTOMERS
-- ============================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_own_farm"
ON public.customers
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customers.farm_id
    )
);


CREATE POLICY "customers_insert_own_farm"
ON public.customers
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customers.farm_id
    )
);


CREATE POLICY "customers_update_own_farm"
ON public.customers
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customers.farm_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customers.farm_id
    )
);


CREATE POLICY "customers_delete_own_farm"
ON public.customers
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customers.farm_id
    )
);


-- ============================================================
-- 8. RLS — CUSTOMER PAYMENTS
-- ============================================================

ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_payments_select_own_farm"
ON public.customer_payments
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customer_payments.farm_id
    )
);


CREATE POLICY "customer_payments_insert_own_farm"
ON public.customer_payments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customer_payments.farm_id
    )
);


-- ============================================================
-- 9. RLS — PAYMENT ALLOCATIONS
-- ============================================================

ALTER TABLE public.customer_payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_allocations_select_own_farm"
ON public.customer_payment_allocations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customer_payment_allocations.farm_id
    )
);


CREATE POLICY "payment_allocations_insert_own_farm"
ON public.customer_payment_allocations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.farm_id = customer_payment_allocations.farm_id
    )
);


-- ============================================================
-- 10. COMMENTS
-- ============================================================

COMMENT ON TABLE public.customers IS
'Farm customer master records used by Sales and Accounts Receivable.';

COMMENT ON TABLE public.customer_payments IS
'Payments received from farm customers against outstanding sales. Separate from SaaS subscription payments.';

COMMENT ON TABLE public.customer_payment_allocations IS
'Allocates customer payments against individual sales.';

COMMENT ON VIEW public.customer_sale_balances IS
'Calculates amount paid and outstanding balance for each customer-linked sale.';

COMMENT ON VIEW public.customer_balances IS
'Aggregated customer sales, payments and outstanding balances.';