-- ============================================================
-- VIVA Database Schema — Migration 002: Marketplace + Finance
-- ============================================================

-- ============================================================
-- MARKETPLACE
-- ============================================================
CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id       UUID NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL,
    price_viva      FLOAT NOT NULL,
    price_usd       FLOAT,
    images          TEXT[],
    ipfs_images     TEXT[],
    stock           INT DEFAULT 1,
    condition       TEXT DEFAULT 'new',     -- new | used | digital
    is_digital      BOOLEAN DEFAULT FALSE,
    status          TEXT DEFAULT 'active',  -- active | sold | deleted
    views_count     INT DEFAULT 0,
    likes_count     INT DEFAULT 0,
    -- Full-text search vector
    search_vector   TSVECTOR,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_category ON listings(category, status);
CREATE INDEX idx_listings_search ON listings USING GIN(search_vector);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION listings_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.title || ' ' || COALESCE(NEW.description,''));
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER listings_search_trigger BEFORE INSERT OR UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION listings_search_update();

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id        UUID NOT NULL REFERENCES users(id),
    seller_id       UUID NOT NULL REFERENCES users(id),
    listing_id      UUID NOT NULL REFERENCES listings(id),
    quantity        INT DEFAULT 1,
    price_viva      FLOAT NOT NULL,
    status          TEXT DEFAULT 'pending',  -- pending | paid | shipped | completed | disputed | refunded
    escrow_tx_hash  TEXT,
    shipping_addr   JSONB,
    tracking_id     TEXT,
    dispute_reason  TEXT,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX idx_orders_seller ON orders(seller_id, created_at DESC);

CREATE TABLE listing_reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID UNIQUE REFERENCES orders(id),
    listing_id      UUID NOT NULL REFERENCES listings(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINANCE / WALLET
-- ============================================================
CREATE TABLE wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            TEXT NOT NULL,   -- earn | spend | send | receive | stake | unstake | youtoken_buy | youtoken_sell | ad_revenue
    amount_viva     FLOAT NOT NULL,
    from_address    TEXT,
    to_address      TEXT,
    tx_hash         TEXT UNIQUE,
    chain_id        INT DEFAULT 8453,   -- Base L2
    status          TEXT DEFAULT 'confirmed',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('wallet_transactions', 'created_at', chunk_time_interval => INTERVAL '7 days');
CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);

CREATE TABLE earn_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    source          TEXT NOT NULL,   -- attention | ad_revenue | twin_task | referral | marketplace_sale | health_streak | room_host | dating_match
    amount_viva     FLOAT NOT NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('earn_events', 'created_at', chunk_time_interval => INTERVAL '7 days');

CREATE TABLE stakes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    amount_viva     FLOAT NOT NULL,
    purpose         TEXT,       -- room_access | content_gate | dating_boost | governance
    lock_until      TIMESTAMPTZ,
    unstaked_at     TIMESTAMPTZ,
    tx_hash         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- YouToken holdings (tracked off-chain, reconciled on-chain)
CREATE TABLE youtoken_holdings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holder_id       UUID NOT NULL REFERENCES users(id),
    creator_id      UUID NOT NULL REFERENCES users(id),
    token_amount    FLOAT NOT NULL,
    avg_buy_price   FLOAT,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(holder_id, creator_id)
);
CREATE INDEX idx_youtoken_holder ON youtoken_holdings(holder_id);
CREATE INDEX idx_youtoken_creator ON youtoken_holdings(creator_id);

-- Referrals
CREATE TABLE referrals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id     UUID NOT NULL REFERENCES users(id),
    referred_id     UUID UNIQUE REFERENCES users(id),
    code            TEXT UNIQUE NOT NULL,
    reward_referrer FLOAT DEFAULT 5.0,   -- $5 in $VIVA
    reward_referred FLOAT DEFAULT 5.0,
    referrer_paid   BOOLEAN DEFAULT FALSE,
    referred_paid   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    paid_at         TIMESTAMPTZ
);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- ============================================================
-- PREDICTIONS
-- ============================================================
CREATE TABLE prediction_markets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id      UUID NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT,
    outcome_a       TEXT NOT NULL,
    outcome_b       TEXT NOT NULL,
    resolve_at      TIMESTAMPTZ NOT NULL,
    status          TEXT DEFAULT 'open',    -- open | resolved | cancelled
    winner          TEXT,                   -- 'a' | 'b' | 'draw'
    pool_a          FLOAT DEFAULT 0,
    pool_b          FLOAT DEFAULT 0,
    contract_addr   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);
CREATE INDEX idx_markets_status ON prediction_markets(status, resolve_at);

CREATE TABLE prediction_bets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id       UUID NOT NULL REFERENCES prediction_markets(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    outcome         TEXT NOT NULL,   -- 'a' | 'b'
    amount_viva     FLOAT NOT NULL,
    payout          FLOAT,
    tx_hash         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('prediction_bets', 'created_at', chunk_time_interval => INTERVAL '7 days');
