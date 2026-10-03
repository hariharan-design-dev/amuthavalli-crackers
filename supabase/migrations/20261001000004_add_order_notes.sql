-- Migration: Add Order Notes to Orders and Update create_guest_order
-- Phase: Phase 10B — Cart + Order Notes Foundation Implementation
-- Reference: docs/phase-10a-cart-checkout-architecture.md
-- Target: PostgreSQL (Supabase)

-- ============================================================================
-- 1. ADD NOTES COLUMN TO ORDERS TABLE
-- ============================================================================
-- Additive column addition to persist optional customer-provided order instructions.
-- If omitted by customer, stores NULL. Plain-text, validated up to 1,000 characters.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- ============================================================================
-- 2. DROP PREVIOUS create_guest_order FUNCTION OVERLOAD
-- ============================================================================
-- Drop the 9-parameter version from migration 3 to ensure only the updated
-- 10-parameter signature with p_notes remains authoritative.
DROP FUNCTION IF EXISTS create_guest_order(
    UUID, TEXT, VARCHAR, TEXT, TEXT, VARCHAR, INTEGER, NUMERIC, JSONB
);

-- ============================================================================
-- 3. CREATE EXTENDED TRANSACTIONAL GUEST ORDER FUNCTION
-- ============================================================================
-- Atomically executes customer profile resolution/upsert, order header insertion
-- (with optional order notes), and bulk line items insertion in a single PostgreSQL
-- transaction block.
--
-- Security Mode: SECURITY INVOKER
-- - Executes with database privileges of calling role (service_role from Server Action).
-- - Eliminates privilege escalation while maintaining strict RLS boundaries.
CREATE OR REPLACE FUNCTION create_guest_order(
    p_idempotency_key UUID,
    p_customer_name TEXT,
    p_customer_mobile VARCHAR(15),
    p_customer_address TEXT,
    p_customer_city TEXT,
    p_customer_pincode VARCHAR(10),
    p_total_quantity INTEGER,
    p_total_amount NUMERIC(10, 2),
    p_items JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_existing_order JSONB;
    v_customer_id UUID;
    v_order_id UUID;
    v_order_number VARCHAR(20);
    v_created_at TIMESTAMPTZ;
    v_status TEXT;
    v_notes TEXT;
    v_result JSONB;
BEGIN
    -- 1. Idempotency Check: Return existing order if key was already committed
    SELECT jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'created_at', o.created_at,
        'status', o.status,
        'notes', o.notes,
        'customer', jsonb_build_object(
            'name', o.customer_name,
            'phone', o.customer_phone,
            'address', o.customer_address,
            'city', o.customer_city,
            'pincode', o.customer_pincode
        ),
        'items', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price
            ))
            FROM order_items oi
            WHERE oi.order_id = o.id
        ), '[]'::jsonb),
        'total_quantity', o.total_quantity,
        'total_amount', o.total_amount
    ) INTO v_existing_order
    FROM orders o
    WHERE o.idempotency_key = p_idempotency_key;

    IF v_existing_order IS NOT NULL THEN
        RETURN v_existing_order;
    END IF;

    -- 2. Customer Resolution: Mobile is the unique business identifier
    -- Upsert ensures atomic customer profile resolution and updates current info
    INSERT INTO customers (name, mobile, address, city, pincode)
    VALUES (p_customer_name, p_customer_mobile, p_customer_address, p_customer_city, p_customer_pincode)
    ON CONFLICT (mobile) DO UPDATE
    SET name = EXCLUDED.name,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        pincode = EXCLUDED.pincode,
        updated_at = now()
    RETURNING id INTO v_customer_id;

    -- 3. Order Creation: Status is hardcoded to 'New', order_number generated via sequence DEFAULT,
    -- and optional customer notes are persisted.
    INSERT INTO orders (
        idempotency_key,
        customer_id,
        customer_name,
        customer_phone,
        customer_address,
        customer_city,
        customer_pincode,
        status,
        total_quantity,
        total_amount,
        notes
    ) VALUES (
        p_idempotency_key,
        v_customer_id,
        p_customer_name,
        p_customer_mobile,
        p_customer_address,
        p_customer_city,
        p_customer_pincode,
        'New',
        p_total_quantity,
        p_total_amount,
        p_notes
    )
    RETURNING id, order_number, created_at, status, notes INTO v_order_id, v_order_number, v_created_at, v_status, v_notes;

    -- 4. Order Items Insertion: Bulk insert line items from JSONB payload
    INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price
    )
    SELECT
        v_order_id,
        (item->>'product_id')::UUID,
        item->>'product_name',
        (item->>'quantity')::INTEGER,
        (item->>'unit_price')::NUMERIC(10, 2),
        (item->>'total_price')::NUMERIC(10, 2)
    FROM jsonb_array_elements(p_items) AS item;

    -- 5. Build Result JSON
    SELECT jsonb_build_object(
        'id', v_order_id,
        'order_number', v_order_number,
        'created_at', v_created_at,
        'status', v_status,
        'notes', v_notes,
        'customer', jsonb_build_object(
            'name', p_customer_name,
            'phone', p_customer_mobile,
            'address', p_customer_address,
            'city', p_customer_city,
            'pincode', p_customer_pincode
        ),
        'items', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price
            ))
            FROM order_items oi
            WHERE oi.order_id = v_order_id
        ), '[]'::jsonb),
        'total_quantity', p_total_quantity,
        'total_amount', p_total_amount
    ) INTO v_result;

    RETURN v_result;

EXCEPTION
    WHEN unique_violation THEN
        -- Handle concurrent duplicate submission race condition
        SELECT jsonb_build_object(
            'id', o.id,
            'order_number', o.order_number,
            'created_at', o.created_at,
            'status', o.status,
            'notes', o.notes,
            'customer', jsonb_build_object(
                'name', o.customer_name,
                'phone', o.customer_phone,
                'address', o.customer_address,
                'city', o.customer_city,
                'pincode', o.customer_pincode
            ),
            'items', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                    'product_name', oi.product_name,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price
                ))
                FROM order_items oi
                WHERE oi.order_id = o.id
            ), '[]'::jsonb),
            'total_quantity', o.total_quantity,
            'total_amount', o.total_amount
        ) INTO v_existing_order
        FROM orders o
        WHERE o.idempotency_key = p_idempotency_key;

        IF v_existing_order IS NOT NULL THEN
            RETURN v_existing_order;
        ELSE
            RAISE;
        END IF;
END;
$$;

-- ============================================================================
-- 4. PERMISSIONS & PRIVILEGE CONTROL
-- ============================================================================
-- Prevent public or direct client execution
REVOKE ALL ON FUNCTION create_guest_order(UUID, TEXT, VARCHAR, TEXT, TEXT, VARCHAR, INTEGER, NUMERIC, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_guest_order(UUID, TEXT, VARCHAR, TEXT, TEXT, VARCHAR, INTEGER, NUMERIC, JSONB, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION create_guest_order(UUID, TEXT, VARCHAR, TEXT, TEXT, VARCHAR, INTEGER, NUMERIC, JSONB, TEXT) FROM authenticated;

-- Grant execution exclusively to service_role (invoked only by server-side Server Action)
GRANT EXECUTE ON FUNCTION create_guest_order(UUID, TEXT, VARCHAR, TEXT, TEXT, VARCHAR, INTEGER, NUMERIC, JSONB, TEXT) TO service_role;
