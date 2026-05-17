-- Three-tier memory system for agents
-- These tables implement the core of Forge's defensibility moat

-- Working memory: Current execution context
-- Stores active agent state during task execution
CREATE TABLE IF NOT EXISTS working_memory (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    context_key TEXT NOT NULL,
    context_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(agent_id, task_id, context_key)
);

CREATE INDEX idx_working_memory_agent_task ON working_memory(agent_id, task_id);
CREATE INDEX idx_working_memory_expires ON working_memory(expires_at) WHERE expires_at IS NOT NULL;

-- Episodic memory: Historical execution records
-- Stores complete episode records (what happened, when, context, outcome)
CREATE TABLE IF NOT EXISTS episodic_memory (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    episode_id TEXT NOT NULL UNIQUE,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    episode_type VARCHAR(50) NOT NULL, -- 'task', 'tool_execution', 'decision', 'error'
    episode_context JSONB NOT NULL, -- Full context of what happened
    outcome JSONB, -- Result of the episode
    success BOOLEAN,
    importance_score FLOAT DEFAULT 0.5, -- 0-1, higher = more important to recall
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recalled_count INTEGER DEFAULT 0 -- How many times this memory was recalled (decay metric)
);

CREATE INDEX idx_episodic_memory_agent ON episodic_memory(agent_id);
CREATE INDEX idx_episodic_memory_task ON episodic_memory(task_id);
CREATE INDEX idx_episodic_memory_created ON episodic_memory(created_at DESC);
CREATE INDEX idx_episodic_memory_importance ON episodic_memory(agent_id, importance_score DESC);
CREATE INDEX idx_episodic_memory_type ON episodic_memory(agent_id, episode_type);

-- Semantic memory: Learned patterns and relationships
-- Stores aggregated knowledge about tool relationships, patterns, and learned heuristics
CREATE TABLE IF NOT EXISTS semantic_memory (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    semantic_key TEXT NOT NULL, -- e.g., 'tool_relationship', 'pattern', 'heuristic'
    semantic_value JSONB NOT NULL, -- Structured knowledge
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    supported_by_episodes BIGINT[] NOT NULL DEFAULT '{}', -- References to episodic_memory IDs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    UNIQUE(agent_id, semantic_key)
);

CREATE INDEX idx_semantic_memory_agent ON semantic_memory(agent_id);
CREATE INDEX idx_semantic_memory_confidence ON semantic_memory(agent_id, confidence DESC);
CREATE INDEX idx_semantic_memory_updated ON semantic_memory(updated_at DESC);

-- Trigger for semantic_memory updated_at
CREATE OR REPLACE FUNCTION update_semantic_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER semantic_memory_timestamp_trigger
BEFORE UPDATE ON semantic_memory
FOR EACH ROW
EXECUTE FUNCTION update_semantic_memory_timestamp();

-- Memory relationships: Links between memory tiers
-- Connects episodic memories to semantic patterns
CREATE TABLE IF NOT EXISTS memory_relationships (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    from_memory_type VARCHAR(20) NOT NULL CHECK (from_memory_type IN ('working', 'episodic', 'semantic')),
    from_memory_id BIGINT NOT NULL,
    to_memory_type VARCHAR(20) NOT NULL CHECK (to_memory_type IN ('working', 'episodic', 'semantic')),
    to_memory_id BIGINT NOT NULL,
    relationship_type VARCHAR(50) NOT NULL, -- 'causes', 'supports', 'contradicts', 'reinforces'
    strength FLOAT NOT NULL CHECK (strength >= -1 AND strength <= 1), -- -1 = contradicts, 0 = neutral, 1 = reinforces
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_relationships_from ON memory_relationships(agent_id, from_memory_type, from_memory_id);
CREATE INDEX idx_memory_relationships_to ON memory_relationships(to_memory_type, to_memory_id);
CREATE INDEX idx_memory_relationships_type ON memory_relationships(relationship_type);
