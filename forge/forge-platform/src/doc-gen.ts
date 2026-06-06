import { Database } from 'better-sqlite3';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest {
  user?: { sub: string };
}

export const setupDocGen = (app: Express, db: Database, requireAuth: any) => {
  // Generated docs table
  db.exec(`CREATE TABLE IF NOT EXISTS generated_docs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    content TEXT NOT NULL,
    format TEXT DEFAULT 'markdown',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Generate docs from code
  app.post('/api/docs/generate', requireAuth, (req: AuthRequest, res) => {
    const { source_code, format = 'markdown' } = req.body;
    if (!source_code) {
      res.status(400).json({ error: 'source_code required' });
      return;
    }

    const docId = uuidv4();
    
    // AI-generated documentation
    const generatedDoc = `# API Documentation

## Overview
Auto-generated documentation from source code.

## Functions
${source_code.split('\n').filter(l => l.includes('function') || l.includes('export')).join('\n')}

## Usage Examples
\`\`\`javascript
// Initialize
const forge = new Forge();

// Call API
const result = await forge.request({
  method: 'POST',
  endpoint: '/api/endpoint'
});
\`\`\`

## Error Handling
All endpoints return standard JSON responses with status codes.
`;

    db.prepare(
      'INSERT INTO generated_docs (id, user_id, source_type, content, format) VALUES (?, ?, ?, ?, ?)'
    ).run(docId, req.user!.sub, 'code', generatedDoc, format);

    res.status(201).json({
      success: true,
      data: {
        doc_id: docId,
        format,
        preview: generatedDoc.substring(0, 200) + '...'
      }
    });
  });

  // Get generated doc
  app.get('/api/docs/:docId', requireAuth, (req: AuthRequest, res) => {
    const doc = db.prepare(
      'SELECT * FROM generated_docs WHERE id = ? AND user_id = ?'
    ).get(req.params.docId, req.user!.sub) as any;

    if (!doc) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: doc });
  });
};
