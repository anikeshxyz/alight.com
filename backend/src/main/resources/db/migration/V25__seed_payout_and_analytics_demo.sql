-- V25: Seed Demo Payout Batches, Commission Invoices & Tax Compliance Ledgers

DO $$
DECLARE
    v_vendor_apex_id UUID;
    v_vendor_nova_id UUID;
    v_vendor_zenith_id UUID;
    v_batch_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO v_vendor_apex_id FROM vendors WHERE slug = 'apex-electronics' LIMIT 1;
    SELECT id INTO v_vendor_nova_id FROM vendors WHERE slug = 'nova-home-appliances' LIMIT 1;
    SELECT id INTO v_vendor_zenith_id FROM vendors WHERE slug = 'zenith-kitchen-collection' LIMIT 1;

    -- If no specific vendors found by slug, fallback to any available vendors
    IF v_vendor_apex_id IS NULL THEN
        SELECT id INTO v_vendor_apex_id FROM vendors LIMIT 1;
    END IF;
    IF v_vendor_nova_id IS NULL THEN
        SELECT id INTO v_vendor_nova_id FROM vendors OFFSET 1 LIMIT 1;
    END IF;
    IF v_vendor_zenith_id IS NULL THEN
        SELECT id INTO v_vendor_zenith_id FROM vendors OFFSET 2 LIMIT 1;
    END IF;

    IF v_vendor_apex_id IS NOT NULL THEN
        -- 1. Create a Completed Payout Batch
        INSERT INTO payout_batches (
            id, batch_reference, total_amount, currency_code, payout_count, status, bank_batch_id, processed_at, notes, created_at
        ) VALUES (
            v_batch_id,
            'PB-2026-0001',
            145850.00,
            'INR',
            3,
            'COMPLETED',
            'HDFC-CORP-TXN-889100',
            CURRENT_TIMESTAMP - INTERVAL '5 days',
            'Quarterly bulk settlement disbursal for verified domestic sellers',
            CURRENT_TIMESTAMP - INTERVAL '5 days'
        ) ON CONFLICT (batch_reference) DO NOTHING;

        -- Update any existing payouts to belong to this batch
        UPDATE vendor_payouts SET batch_id = v_batch_id WHERE batch_id IS NULL;

        -- 2. Seed Marketplace Commission Invoices
        INSERT INTO marketplace_commission_invoices (
            invoice_number, vendor_id, period_month, period_year, gross_sales, commission_rate, commission_amount,
            gst_rate, cgst_amount, sgst_amount, igst_amount, total_invoice_amount, status, created_at
        ) VALUES (
            'INV-2026-000101',
            v_vendor_apex_id,
            1,
            2026,
            185000.00,
            8.00,
            14800.00,
            18.00,
            1332.00,
            1332.00,
            0.00,
            17464.00,
            'PAID',
            CURRENT_TIMESTAMP - INTERVAL '60 days'
        ),
        (
            'INV-2026-000102',
            v_vendor_apex_id,
            2,
            2026,
            245000.00,
            8.00,
            19600.00,
            18.00,
            1764.00,
            1764.00,
            0.00,
            23128.00,
            'PAID',
            CURRENT_TIMESTAMP - INTERVAL '30 days'
        ) ON CONFLICT (invoice_number) DO NOTHING;

        -- 3. Seed Tax Compliance Ledgers
        INSERT INTO tax_compliance_ledgers (
            vendor_id, financial_year, quarter, month, gross_sales_amount, returns_amount, net_taxable_supplies,
            tcs_rate, tcs_amount, tds_rate, tds_amount, commission_amount, commission_gst, net_payout_disbursed,
            status, vendor_gstin, vendor_pan, filed_at, created_at
        ) VALUES (
            v_vendor_apex_id,
            '2025-2026',
            'Q4',
            1,
            185000.00,
            5000.00,
            180000.00,
            1.00,
            1800.00,
            0.10,
            185.00,
            14800.00,
            2664.00,
            160551.00,
            'FILED',
            '27AAAAA0000A1Z5',
            'AAAAA0000A',
            CURRENT_TIMESTAMP - INTERVAL '40 days',
            CURRENT_TIMESTAMP - INTERVAL '60 days'
        ),
        (
            v_vendor_apex_id,
            '2025-2026',
            'Q4',
            2,
            245000.00,
            12000.00,
            233000.00,
            1.00,
            2330.00,
            0.10,
            245.00,
            19600.00,
            3528.00,
            207297.00,
            'RECONCILED',
            '27AAAAA0000A1Z5',
            'AAAAA0000A',
            CURRENT_TIMESTAMP - INTERVAL '10 days',
            CURRENT_TIMESTAMP - INTERVAL '30 days'
        ) ON CONFLICT ON CONSTRAINT uq_vendor_tax_period DO NOTHING;
    END IF;

    IF v_vendor_nova_id IS NOT NULL THEN
        INSERT INTO marketplace_commission_invoices (
            invoice_number, vendor_id, period_month, period_year, gross_sales, commission_rate, commission_amount,
            gst_rate, cgst_amount, sgst_amount, igst_amount, total_invoice_amount, status, created_at
        ) VALUES (
            'INV-2026-000103',
            v_vendor_nova_id,
            2,
            2026,
            160000.00,
            10.00,
            16000.00,
            18.00,
            0.00,
            0.00,
            2880.00,
            18880.00,
            'ISSUED',
            CURRENT_TIMESTAMP - INTERVAL '15 days'
        ) ON CONFLICT (invoice_number) DO NOTHING;

        INSERT INTO tax_compliance_ledgers (
            vendor_id, financial_year, quarter, month, gross_sales_amount, returns_amount, net_taxable_supplies,
            tcs_rate, tcs_amount, tds_rate, tds_amount, commission_amount, commission_gst, net_payout_disbursed,
            status, vendor_gstin, vendor_pan, created_at
        ) VALUES (
            v_vendor_nova_id,
            '2025-2026',
            'Q4',
            2,
            160000.00,
            0.00,
            160000.00,
            1.00,
            1600.00,
            0.10,
            160.00,
            16000.00,
            2880.00,
            139360.00,
            'RECONCILED',
            '07BBBBB1111B1Z9',
            'BBBBB1111B',
            CURRENT_TIMESTAMP - INTERVAL '15 days'
        ) ON CONFLICT ON CONSTRAINT uq_vendor_tax_period DO NOTHING;
    END IF;

END $$;
