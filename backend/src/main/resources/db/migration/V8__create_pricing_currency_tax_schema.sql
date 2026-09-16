-- V8: Multi-Currency, Multi-Tax & Dynamic Pricing Schema

CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places INT NOT NULL DEFAULT 2,
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    exchange_rate_to_base NUMERIC(18, 6) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);

CREATE TABLE IF NOT EXISTS exchange_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_code VARCHAR(10) NOT NULL,
    rate NUMERIC(18, 6) NOT NULL,
    source VARCHAR(50) DEFAULT 'MANUAL',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ex_rate_hist_code ON exchange_rate_history(currency_code);
CREATE INDEX IF NOT EXISTS idx_ex_rate_hist_time ON exchange_rate_history(recorded_at);

CREATE TABLE IF NOT EXISTS tax_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    hsn_sac_code VARCHAR(20),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_cat_code ON tax_categories(code);
CREATE INDEX IF NOT EXISTS idx_tax_cat_hsn ON tax_categories(hsn_sac_code);

CREATE TABLE IF NOT EXISTS tax_jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL,
    state_code VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    tax_regime VARCHAR(50) NOT NULL DEFAULT 'GST',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_jur_country ON tax_jurisdictions(country_code);
CREATE INDEX IF NOT EXISTS idx_tax_jur_state ON tax_jurisdictions(state_code);

CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_category_id UUID NOT NULL REFERENCES tax_categories(id) ON DELETE CASCADE,
    jurisdiction_id UUID REFERENCES tax_jurisdictions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    is_inter_state BOOLEAN,
    total_rate NUMERIC(7, 4) NOT NULL DEFAULT 0.0000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_category ON tax_rules(tax_category_id);
CREATE INDEX IF NOT EXISTS idx_tax_rules_jurisdiction ON tax_rules(jurisdiction_id);

CREATE TABLE IF NOT EXISTS tax_rate_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_rule_id UUID NOT NULL REFERENCES tax_rules(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    rate_percent NUMERIC(7, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_comp_rule ON tax_rate_components(tax_rule_id);

CREATE TABLE IF NOT EXISTS product_tier_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    min_quantity INT NOT NULL,
    max_quantity INT,
    tier_price NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tier_min_qty CHECK (min_quantity >= 1),
    CONSTRAINT chk_tier_price CHECK (tier_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tier_prices_product ON product_tier_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_tier_prices_variant ON product_tier_prices(variant_id);
