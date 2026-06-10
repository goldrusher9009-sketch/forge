-- ============================================================
-- VIVA Database Schema — Migration 001: Core Tables
-- PostgreSQL 15 + TimescaleDB + pgvector
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- full-text search

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL,
    email           TEXT UNIQUE,
    phone           TEXT UNIQUE,
    avatar_url      TEXT,
    bio             TEXT,
    world_id        TEXT UNIQUE,              -- World ID proof-of-human
    wallet_address  TEXT UNIQUE,             -- Base L2 embedded wallet
    you_token       TEXT,                    -- ERC-20 contract address
    is_verified     BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    onboarding_done BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_username ON users USING btree(username);
CREATE INDEX idx_users_wallet ON users USING btree(wallet_address);

-- ============================================================
-- V-SCORE
-- ============================================================
CREATE TABLE vscore (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    score           FLOAT NOT NULL DEFAULT 0,   -- 0-1000
    tier            TEXT NOT NULL DEFAULT 'seed',
    streak_days     INT DEFAULT 0,
    last_computed   TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vscore_rings (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    social          FLOAT DEFAULT 0,   -- 0-100
    wealth          FLOAT DEFAULT 0,
    activity        FLOAT DEFAULT 0,
    sleep           FLOAT DEFAULT 0,
    nutrition       FLOAT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Score event log (TimescaleDB hypertable for time-series analytics)
CREATE TABLE score_events (
    id              BIGSERIAL,
    user_id         UUID NOT NULL REFERENCES users(id),
    event_type      TEXT NOT NULL,    -- e.g. 'health.sleep', 'social.post', 'commerce.sale'
    delta           FLOAT DEFAULT 0,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
);
SELECT create_hypertable('score_events', 'created_at', chunk_time_interval => INTERVAL '7 days');
CREATE INDEX idx_score_events_user ON score_events (user_id, created_at DESC);

-- ============================================================
-- MESSENGER
-- ============================================================
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            TEXT NOT NULL DEFAULT 'direct',  -- direct | group | room
    name            TEXT,
    avatar_url      TEXT,
    created_by      UUID REFERENCES users(id),
    is_encrypted    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT DEFAULT 'member',    -- admin | member
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    last_read_at    TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX idx_conv_members_user ON conversation_members(user_id);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id       UUID NOT NULL REFERENCES users(id),
    type            TEXT DEFAULT 'text',     -- text | image | video | audio | viva_tip | sticker | nft_preview
    content         TEXT,
    media_url       TEXT,
    ipfs_hash       TEXT,
    viva_amount     FLOAT,                   -- for tip messages
    reply_to_id     UUID REFERENCES messages(id),
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('messages', 'created_at', chunk_time_interval => INTERVAL '7 days');
CREATE INDEX idx_messages_conv ON messages (conversation_id, created_at DESC);

-- ============================================================
-- SOCIAL FEED
-- ============================================================
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id      UUID NOT NULL REFERENCES users(id),
    video_url       TEXT,
    thumbnail_url   TEXT,
    caption         TEXT,
    ipfs_hash       TEXT UNIQUE,
    arweave_hash    TEXT,
    is_nft          BOOLEAN DEFAULT FALSE,
    nft_contract    TEXT,
    nft_token_id    TEXT,
    ad_slot_open    BOOLEAN DEFAULT FALSE,
    ad_buyer_id     UUID REFERENCES users(id),
    ad_price_viva   FLOAT DEFAULT 0,
    likes_count     INT DEFAULT 0,
    comments_count  INT DEFAULT 0,
    shares_count    INT DEFAULT 0,
    views_count     BIGINT DEFAULT 0,
    attention_pool  FLOAT DEFAULT 0,         -- total $VIVA in attention pool
    status          TEXT DEFAULT 'active',   -- active | deleted | flagged
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_creator ON posts(creator_id, created_at DESC);
CREATE INDEX idx_posts_active ON posts(status, created_at DESC) WHERE status = 'active';

CREATE TABLE post_likes (
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE attention_rewards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id         UUID NOT NULL REFERENCES posts(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    amount_viva     FLOAT NOT NULL,
    tx_hash         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
SELECT create_hypertable('attention_rewards', 'created_at', chunk_time_interval => INTERVAL '7 days');
