import { Database } from 'better-sqlite3';
import { Express } from 'express';

interface AuthRequest {
  user?: { sub: string };
}

export const setupApiDocs = (app: Express, db: Database, requireAuth: any) => {
  // OpenAPI schema
  const openAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'Forge Platform API',
      version: '6.75.0',
      description: 'Complete API for Forge AI SaaS platform'
    },
    servers: [
      {
        url: 'https://forge-production-2692.up.railway.app',
        description: 'Production'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development'
      }
    ],
    paths: {
      '/api/threads': {
        post: {
          summary: 'Create thread',
          tags: ['Threads'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    model: { type: 'string', default: 'claude-3-sonnet' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Thread created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          title: { type: 'string' },
                          model: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/threads/{id}/chat': {
        post: {
          summary: 'Send message to thread',
          tags: ['Threads'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    model: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Message processed'
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  };

  // Serve OpenAPI spec
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(openAPISpec);
  });

  // Serve Swagger UI
  app.get('/api/docs', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Forge API Docs</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
        <script>
          window.onload = () => {
            const ui = SwaggerUIBundle({
              url: '/api/docs/openapi.json',
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
              layout: 'BaseLayout'
            });
            window.ui = ui;
          };
        </script>
      </body>
      </html>
    `);
  });

  // SDK generator endpoint
  app.post('/api/docs/generate-sdk', requireAuth, (req: AuthRequest, res) => {
    const { language = 'typescript' } = req.body;

    const sdkTemplates: Record<string, string> = {
      typescript: `
// Forge SDK - TypeScript
import axios from 'axios';

class ForgeClient {
  private baseURL = 'https://forge-production-2692.up.railway.app';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async createThread(title: string) {
    return axios.post(\`\${this.baseURL}/api/threads\`, { title }, {
      headers: { Authorization: \`Bearer \${this.accessToken}\` }
    });
  }

  async sendMessage(threadId: string, message: string) {
    return axios.post(\`\${this.baseURL}/api/threads/\${threadId}/chat\`, { message }, {
      headers: { Authorization: \`Bearer \${this.accessToken}\` }
    });
  }
}

export default ForgeClient;
      `,
      python: `
# Forge SDK - Python
import requests

class ForgeClient:
    def __init__(self, access_token):
        self.base_url = 'https://forge-production-2692.up.railway.app'
        self.access_token = access_token
        self.headers = {'Authorization': f'Bearer {access_token}'}

    def create_thread(self, title):
        return requests.post(
            f'{self.base_url}/api/threads',
            json={'title': title},
            headers=self.headers
        )

    def send_message(self, thread_id, message):
        return requests.post(
            f'{self.base_url}/api/threads/{thread_id}/chat',
            json={'message': message},
            headers=self.headers
        )
      `,
      javascript: `
// Forge SDK - JavaScript
class ForgeClient {
  constructor(accessToken) {
    this.baseURL = 'https://forge-production-2692.up.railway.app';
    this.accessToken = accessToken;
  }

  async createThread(title) {
    const response = await fetch(\`\${this.baseURL}/api/threads\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.accessToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
    return response.json();
  }

  async sendMessage(threadId, message) {
    const response = await fetch(\`\${this.baseURL}/api/threads/\${threadId}/chat\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.accessToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    return response.json();
  }
}
      `
    };

    res.json({
      success: true,
      data: {
        language,
        sdk_code: sdkTemplates[language] || sdkTemplates.typescript
      }
    });
  });

  // API usage stats
  app.get('/api/docs/usage', requireAuth, (req: AuthRequest, res) => {
    const usage = db.prepare(
      'SELECT COUNT(*) as total_requests FROM usage_logs WHERE user_id = ?'
    ).get(req.user!.sub) as any;

    const byModel = db.prepare(`
      SELECT model, COUNT(*) as count, SUM(total_tokens) as tokens
      FROM usage_logs
      WHERE user_id = ?
      GROUP BY model
      ORDER BY count DESC
    `).all(req.user!.sub) as any[];

    res.json({
      success: true,
      data: {
        total_requests: usage.total_requests,
        by_model: byModel
      }
    });
  });
};
