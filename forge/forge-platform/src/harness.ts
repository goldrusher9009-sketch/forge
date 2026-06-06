import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

interface Task {
  id: string;
  name: string;
  tools: string[];
  dependencies: string[];
  status: 'pending' | 'running' | 'done';
}

export const setupAgentHarness = (app: Express, db: Database, requireAuth: any) => {
  // 40 permuted tools library
  const TOOLS = [
    'file-read', 'file-write', 'file-search', 'database-query', 'api-call',
    'code-execute', 'code-review', 'test-runner', 'debugger', 'profiler',
    'git-commit', 'git-push', 'git-pull', 'shell-execute', 'env-get',
    'config-read', 'config-write', 'cache-get', 'cache-set', 'queue-submit',
    'email-send', 'slack-send', 'webhook-call', 'auth-verify', 'crypto-hash',
    'image-process', 'video-encode', 'audio-transcribe', 'nlp-sentiment', 'ml-predict',
    'vector-embed', 'vector-search', 'memory-store', 'memory-retrieve', 'schedule-job',
    'metric-record', 'alert-trigger', 'monitor-health', 'deploy-service', 'rollback-deployment'
  ];

  // DAG task decomposition
  db.exec(`CREATE TABLE IF NOT EXISTS harness_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    dag TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Decompose prompt into DAG of tasks
  app.post('/api/harness/decompose', requireAuth, (req: AuthRequest, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'prompt required' });
      return;
    }

    // In prod: use Claude to decompose prompt into task DAG
    const tasks: Task[] = [
      {
        id: uuidv4(),
        name: 'Analyze requirement',
        tools: ['nlp-sentiment', 'memory-retrieve'],
        dependencies: [],
        status: 'pending'
      },
      {
        id: uuidv4(),
        name: 'Generate solution',
        tools: ['code-execute', 'ml-predict'],
        dependencies: ['task1'],
        status: 'pending'
      },
      {
        id: uuidv4(),
        name: 'Verify & deploy',
        tools: ['test-runner', 'deploy-service'],
        dependencies: ['task2'],
        status: 'pending'
      }
    ];

    const harness_id = uuidv4();
    db.prepare(
      'INSERT INTO harness_tasks (id, user_id, prompt, dag, status) VALUES (?, ?, ?, ?, ?)'
    ).run(harness_id, req.user!.sub, prompt, JSON.stringify(tasks), 'pending');

    res.status(201).json({ success: true, data: { harness_id, tasks, tools_available: TOOLS.length } });
  });

  // Execute task
  app.post('/api/harness/execute/:taskId', requireAuth, (req: AuthRequest, res) => {
    const { tool, args } = req.body;
    if (!tool || !TOOLS.includes(tool)) {
      res.status(400).json({ error: 'invalid tool' });
      return;
    }

    // Simulate tool execution
    const result = {
      tool,
      status: 'success',
      output: `Tool '${tool}' executed with args: ${JSON.stringify(args)}`,
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, data: result });
  });

  // Get harness status
  app.get('/api/harness/status/:harness_id', requireAuth, (req: AuthRequest, res) => {
    const harness = db.prepare(
      'SELECT * FROM harness_tasks WHERE id = ? AND user_id = ?'
    ).get(req.params.harness_id, req.user!.sub) as any;

    if (!harness) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: harness.id,
        status: harness.status,
        tasks: JSON.parse(harness.dag),
        result: harness.result
      }
    });
  });

  // List available tools
  app.get('/api/harness/tools', requireAuth, (req: AuthRequest, res) => {
    res.json({ success: true, data: { tools: TOOLS, count: TOOLS.length } });
  });
};
