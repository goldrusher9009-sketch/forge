-- ============================================================
-- VIVA Database Schema — Migration 003: Health, Dating, Rooms
-- ============================================================

-- ============================================================
-- HEALTH VAULT (ZK-attested only — no raw biometrics)
-- ============================================================
CREATE TABLE health_sleep (
    user_id         UUID NOT NULL REFERENCES users(id),
    date            DATE NOT NULL,
    score           FLOAT NOT NULL,    -- 0-100 aggregate
    zk_proof_hash   TEXT NOT NULL,     -- iden3 proof hash
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, date)
);

CREATE TABLE health_activity (
    user_id         UUID NOT NULL REFERENCES users(id),
    date            DATE NOT NULL,
    score           FLOAT NOT NULL,
    steps_bucket    TEXT,              -- bucketed "8000-8999"
    zk_proof_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, date)
);

CREATE TABLE health_nutrition (
    user_id         UUID NOT NULL REFERENCES users(id),
    date            DATE NOT NULL,
    score           FLOAT NOT NULL,
    zk_proof_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, date)
);

-- Materialized daily summary view (for HomeCanvas rings)
CREATE MATERIALIZED VIEW health_daily_summary AS
SELECT
    u.id AS user_id,
    d.date,
    COALESCE(s.score, 0) AS sleep_score,
    COALESCE(a.score, 0) AS activity_score,
    COALESCE(n.score, 0) AS nutrition_score
FROM users u
CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, '1 day') d(date)
LEFT JOIN health_sleep s ON s.user_id = u.id AND s.date = d.date
LEFT JOIN health_activity a ON a.user_id = u.id AND a.date = d.date
LEFT JOIN health_nutrition n ON n.user_id = u.id AND n.date = d.date;

CREATE UNIQUE INDEX ON health_daily_summary(user_id, date);

-- ============================================================
-- DATING
-- ============================================================
CREATE TABLE dating_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    bio             TEXT,
    age             INT,
    gender          TEXT,
    interested_in   TEXT[],
    location_lat    FLOAT,
    location_lon    FLOAT,
    max_distance_km INT DEFAULT 50,
    photos          TEXT[],
    prompts         JSONB DEFAULT '[]',   -- Q&A prompts
    vscore_gate     FLOAT DEFAULT 0,      -- min V-Score to see this profile
    is_visible      BOOLEAN DEFAULT TRUE,
    last_active     TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dating_location ON dating_profiles USING btree(location_lat, location_lon);
CREATE INDEX idx_dating_visible ON dating_profiles(is_visible) WHERE is_visible = TRUE;

-- pgvector embedding for ML matching
ALTER TABLE dating_profiles ADD COLUMN embedding vector(384);
CREATE INDEX idx_dating_embedding ON dating_profiles USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE swipes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id       UUID NOT NULL REFERENCES users(id),
    target_id       UUID NOT NULL REFERENCES users(id),
    action          TEXT NOT NULL,   -- like | pass | superlike
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(swiper_id, target_id)
);
SELECT create_hypertable('swipes', 'created_at', chunk_time_interval => INTERVAL '7 days');
CREATE INDEX idx_swipes_swiper ON swipes(swiper_id, created_at DESC);

CREATE TABLE matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id       UUID NOT NULL REFERENCES users(id),
    user_b_id       UUID NOT NULL REFERENCES users(id),
    conversation_id UUID REFERENCES conversations(id),
    match_score     FLOAT,    -- ML compatibility score 0-1
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_a_id, user_b_id)
);
CREATE INDEX idx_matches_user_a ON matches(user_a_id, created_at DESC);
CREATE INDEX idx_matches_user_b ON matches(user_b_id, created_at DESC);

-- ============================================================
-- ROOMS (Audio Rooms)
-- ============================================================
CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id         UUID NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT,
    is_live         BOOLEAN DEFAULT FALSE,
    is_private      BOOLEAN DEFAULT FALSE,
    stake_gate      FLOAT DEFAULT 0,     -- min $VIVA stake to enter
    vscore_gate     FLOAT DEFAULT 0,
    livekit_room_id TEXT UNIQUE,
    recording_url   TEXT,
    listener_count  INT DEFAULT 0,
    max_speakers    INT DEFAULT 10,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);
CREATE INDEX idx_rooms_live ON rooms(is_live, created_at DESC) WHERE is_live = TRUE;

CREATE TABLE room_participants (
    room_id         UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT DEFAULT 'listener',  -- host | speaker | listener
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    left_at         TIMESTAMPTZ,
    PRIMARY KEY (room_id, user_id)
);
CREATE INDEX idx_room_participants_user ON room_participants(user_id);

CREATE TABLE room_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id         UUID NOT NULL REFERENCES rooms(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('room_messages', 'created_at', chunk_time_interval => INTERVAL '7 days');

-- ============================================================
-- AI TWIN
-- ============================================================
CREATE TABLE twin_profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    autonomy_level  TEXT DEFAULT 'suggest',   -- suggest | semi-auto | full-auto
    persona_data    JSONB DEFAULT '{}',        -- learned preferences
    total_earned    FLOAT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE twin_tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    domain          TEXT NOT NULL,    -- commerce|dating|food|freelance|finance|health
    description     TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',   -- pending|running|awaiting_approval|approved|rejected|completed|failed
    earned_viva     FLOAT DEFAULT 0,
    result          JSONB,
    error           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_twin_tasks_user ON twin_tasks(user_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE device_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    token           TEXT UNIQUE NOT NULL,
    platform        TEXT NOT NULL,   -- ios | android
    active          BOOLEAN DEFAULT TRUE,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id) WHERE active = TRUE;

CREATE TABLE notification_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    title           TEXT,
    body            TEXT,
    data            JSONB,
    read_at         TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT create_hypertable('notification_log', 'sent_at', chunk_time_interval => INTERVAL '7 days');
CREATE INDEX idx_notif_log_user ON notification_log(user_id, sent_at DESC);

-- ============================================================
-- MODERATION
-- ============================================================
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    reported_id     UUID REFERENCES users(id),
    content_id      UUID,
    content_type    TEXT,   -- post | message | room | listing | profile
    reason          TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',  -- pending | reviewed | actioned | dismissed
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

CREATE TABLE blocks (
    blocker_id      UUID REFERENCES users(id),
    blocked_id      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);
