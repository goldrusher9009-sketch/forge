-- Triggers to connect execution history to episodic memory
-- These triggers implement the outcome data flywheel: executions feed both
-- tool metrics (for performance monitoring) AND episodic memory (for agent learning)

-- Function to create episodic memory records from execution completions
-- This bridges execution_history → episodic_memory, enabling the agent to learn from outcomes
CREATE OR REPLACE FUNCTION create_episodic_memory_from_execution()
RETURNS TRIGGER AS $$
DECLARE
    v_episode_id TEXT;
    v_importance_score FLOAT;
BEGIN
    -- Generate unique episode ID
    v_episode_id := 'episode_' || NEW.execution_id;
    
    -- Calculate importance based on outcome and complexity
    -- Failures are always important (0.8+), successes with high complexity get 0.6+
    -- This ensures agent focuses on challenging and failed executions
    v_importance_score := CASE
        WHEN NOT NEW.success THEN 0.9  -- Failures are critical learning opportunities
        WHEN NEW.input_complexity > 0.7 THEN 0.7  -- Complex successes worth remembering
        WHEN NEW.input_complexity > 0.5 THEN 0.6
        ELSE 0.4  -- Simple successes are less important
    END;
    
    -- Insert episodic memory record
    INSERT INTO episodic_memory (
        agent_id,
        episode_id,
        task_id,
        episode_type,
        episode_context,
        outcome,
        success,
        importance_score,
        recalled_count
    )
    SELECT
        t.agent_id,
        v_episode_id,
        NEW.task_id,
        'tool_execution',
        jsonb_build_object(
            'tool_id', NEW.tool_id,
            'tool_name', NEW.tool_name,
            'execution_id', NEW.execution_id,
            'model_used', NEW.model_used,
            'input_complexity', NEW.input_complexity,
            'output_complexity', NEW.output_complexity,
            'retry_attempt', NEW.retry_attempt,
            'duration_ms', NEW.duration_ms,
            'input', NEW.input
        ),
        jsonb_build_object(
            'output', NEW.output,
            'error', NEW.error,
            'completed_at', NEW.completed_at
        ),
        NEW.success,
        v_importance_score,
        0
    FROM tasks t
    WHERE t.id = NEW.task_id
    ON CONFLICT DO NOTHING;  -- Idempotent if called multiple times
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: When execution completes, create episodic memory record
CREATE TRIGGER execution_creates_episodic_memory
AFTER INSERT ON execution_history
FOR EACH ROW
WHEN (NEW.success IS NOT NULL)  -- Only after completion (success boolean is set)
EXECUTE FUNCTION create_episodic_memory_from_execution();

-- Function to detect learned patterns and create semantic memory
-- This aggregates multiple episodic memories into generalizable knowledge
CREATE OR REPLACE FUNCTION aggregate_semantic_memory_from_episodes()
RETURNS TRIGGER AS $$
DECLARE
    v_tool_pattern_key TEXT;
    v_pattern_data JSONB;
    v_confidence FLOAT;
    v_success_count BIGINT;
    v_total_count BIGINT;
BEGIN
    -- Only process high-importance episodes (importance_score > 0.6)
    -- This prevents noise from cluttering semantic memory
    IF NEW.importance_score < 0.6 THEN
        RETURN NEW;
    END IF;
    
    -- If this is a tool_execution episode, aggregate tool-specific patterns
    IF NEW.episode_type = 'tool_execution' THEN
        v_tool_pattern_key := 'tool_pattern_' || (NEW.episode_context->>'tool_id');
        
        -- Count successes vs failures for this tool
        SELECT
            COUNT(*) FILTER (WHERE success = true) as successes,
            COUNT(*) as total
        INTO
            v_success_count,
            v_total_count
        FROM episodic_memory
        WHERE
            agent_id = NEW.agent_id
            AND episode_type = 'tool_execution'
            AND (episode_context->>'tool_id') = (NEW.episode_context->>'tool_id')
            AND importance_score > 0.6;
        
        -- Calculate confidence based on success rate
        v_confidence := CASE
            WHEN v_total_count < 3 THEN 0.3  -- Low confidence with few samples
            WHEN v_total_count < 10 THEN 0.5 + (v_success_count::FLOAT / v_total_count) * 0.2
            ELSE 0.6 + (v_success_count::FLOAT / v_total_count) * 0.4
        END;
        
        -- Build pattern data
        v_pattern_data := jsonb_build_object(
            'tool_id', NEW.episode_context->>'tool_id',
            'tool_name', NEW.episode_context->>'tool_name',
            'success_rate', v_success_count::FLOAT / NULLIF(v_total_count, 0),
            'sample_count', v_total_count,
            'avg_complexity', (
                SELECT AVG((episode_context->>'input_complexity')::FLOAT)
                FROM episodic_memory
                WHERE agent_id = NEW.agent_id
                AND episode_type = 'tool_execution'
                AND (episode_context->>'tool_id') = (NEW.episode_context->>'tool_id')
                AND importance_score > 0.6
            ),
            'last_used', NEW.created_at
        );
        
        -- Upsert semantic memory (create or update pattern knowledge)
        INSERT INTO semantic_memory (
            agent_id,
            semantic_key,
            semantic_value,
            confidence,
            supported_by_episodes,
            created_at,
            updated_at
        )
        VALUES (
            NEW.agent_id,
            v_tool_pattern_key,
            v_pattern_data,
            v_confidence,
            ARRAY[NEW.id],
            NOW(),
            NOW()
        )
        ON CONFLICT (agent_id, semantic_key) DO UPDATE SET
            semantic_value = EXCLUDED.semantic_value,
            confidence = EXCLUDED.confidence,
            supported_by_episodes = ARRAY_APPEND(semantic_memory.supported_by_episodes, NEW.id),
            updated_at = NOW()
            WHERE array_length(semantic_memory.supported_by_episodes, 1) < 100;
            -- Cap the array size to prevent unbounded growth
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: When high-importance episodic memory is created, aggregate into semantic memory
CREATE TRIGGER episodic_feeds_semantic_memory
AFTER INSERT ON episodic_memory
FOR EACH ROW
EXECUTE FUNCTION aggregate_semantic_memory_from_episodes();

-- Function to establish relationships between memories
-- This enables pattern discovery: detecting which tool behaviors cause successes or failures
CREATE OR REPLACE FUNCTION establish_memory_relationships()
RETURNS TRIGGER AS $$
BEGIN
    -- When a semantic pattern is created/updated, relate it to the episodes that support it
    -- This creates a bidirectional link: episodic → semantic (supports relationship)
    
    IF NEW.supported_by_episodes IS NOT NULL AND array_length(NEW.supported_by_episodes, 1) > 0 THEN
        -- Create relationships from each supporting episode to this semantic memory
        INSERT INTO memory_relationships (
            agent_id,
            from_memory_type,
            from_memory_id,
            to_memory_type,
            to_memory_id,
            relationship_type,
            strength,
            created_at
        )
        SELECT
            NEW.agent_id,
            'episodic',
            episode_id,
            'semantic',
            NEW.id,
            'supports',
            CASE
                WHEN (em.success = true) THEN 0.8  -- Successful executions strongly support the pattern
                WHEN (em.success = false) THEN -0.6  -- Failures contradict positive patterns
                ELSE 0.0
            END,
            NOW()
        FROM (SELECT UNNEST(NEW.supported_by_episodes) as episode_id) e
        JOIN episodic_memory em ON em.id = e.episode_id
        ON CONFLICT DO NOTHING;  -- Idempotent
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: When semantic memory is created/updated with episode support, link them
CREATE TRIGGER semantic_establishes_relationships
AFTER INSERT OR UPDATE ON semantic_memory
FOR EACH ROW
EXECUTE FUNCTION establish_memory_relationships();
