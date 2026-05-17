# Forge Platform API Documentation

## Overview

The Forge Platform API provides comprehensive endpoints for managing workflows, agents, executions, and user accounts. All endpoints are RESTful and require authentication via JWT bearer tokens or API keys.

## Base URL

- **Production**: `https://api.forge.ai/v1`
- **Development**: `http://localhost:8000/api/v1`

## Authentication

### Bearer Token (JWT)
```bash
Authorization: Bearer <jwt_token>
```

### API Key
```bash
X-API-Key: <api_key>
```

## Rate Limiting

- **Rate Limit**: 1000 requests per hour
- **Rate Limit Header**: `X-RateLimit-Remaining`
- **Status Code**: 429 Too Many Requests

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400,
  "details": {}
}
```

Common error codes:
- `INVALID_REQUEST` - Malformed request
- `AUTHENTICATION_FAILED` - Invalid credentials
- `UNAUTHORIZED` - Missing or invalid authentication
- `RESOURCE_NOT_FOUND` - Resource doesn't exist
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

## Authentication Endpoints

### Register User
```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "fullName": "John Doe",
  "verified": false,
  "createdAt": "2026-05-06T10:00:00Z"
}
```

### Login
```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

### Verify Email
```
POST /auth/verify-email
```

**Request:**
```json
{
  "token": "verification-token"
}
```

**Response:** `200 OK`
```json
{
  "verified": true,
  "message": "Email verified successfully"
}
```

### Password Reset Request
```
POST /auth/password-reset
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset link sent to email"
}
```

### Reset Password
```
POST /auth/reset-password
```

**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "NewPass123!"
}
```

**Response:** `200 OK`

## Workflow Endpoints

### List Workflows
```
GET /workflows?skip=0&limit=20&status=active
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "workflow-1",
      "name": "Email Campaign",
      "description": "Automated email campaign workflow",
      "status": "active",
      "agentIds": ["agent-1", "agent-2"],
      "executionCount": 45,
      "successRate": 94.2,
      "createdAt": "2026-01-01T10:00:00Z",
      "updatedAt": "2026-05-01T10:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 20
}
```

### Get Workflow
```
GET /workflows/:id
```

**Response:** `200 OK`
```json
{
  "id": "workflow-1",
  "name": "Email Campaign",
  "description": "Automated email campaign",
  "status": "active",
  "steps": [
    {
      "id": "step-1",
      "name": "Fetch Data",
      "agentId": "agent-1",
      "config": {}
    }
  ],
  "createdAt": "2026-01-01T10:00:00Z"
}
```

### Create Workflow
```
POST /workflows
```

**Request:**
```json
{
  "name": "New Workflow",
  "description": "Description",
  "steps": [
    {
      "name": "Step 1",
      "agentId": "agent-1"
    }
  ]
}
```

**Response:** `201 Created`

### Update Workflow
```
PUT /workflows/:id
```

**Response:** `200 OK`

### Delete Workflow
```
DELETE /workflows/:id
```

**Response:** `204 No Content`

### Execute Workflow
```
POST /workflows/:id/execute
```

**Request:**
```json
{
  "input": {
    "param1": "value1"
  }
}
```

**Response:** `202 Accepted`
```json
{
  "executionId": "exec-123",
  "status": "queued"
}
```

## Agent Endpoints

### List Agents
```
GET /agents?skip=0&limit=20
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "agent-1",
      "name": "Email Agent",
      "description": "Handles email operations",
      "type": "automation",
      "status": "active",
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Get Agent
```
GET /agents/:id
```

### Create Agent
```
POST /agents
```

**Request:**
```json
{
  "name": "New Agent",
  "description": "Description",
  "type": "automation",
  "config": {}
}
```

### Update Agent
```
PUT /agents/:id
```

### Delete Agent
```
DELETE /agents/:id
```

## Execution Endpoints

### List Executions
```
GET /executions?skip=0&limit=20&status=success
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "exec-1",
      "workflowId": "workflow-1",
      "status": "success",
      "startedAt": "2026-05-06T10:00:00Z",
      "completedAt": "2026-05-06T10:05:00Z",
      "duration": 300,
      "result": {}
    }
  ],
  "total": 1
}
```

### Get Execution
```
GET /executions/:id
```

### Get Execution Logs
```
GET /executions/:id/logs
```

## API Key Endpoints

### List API Keys
```
GET /api-keys
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "key-1",
      "name": "Production Key",
      "key": "sk_prod_****",
      "status": "active",
      "createdAt": "2026-01-01T10:00:00Z",
      "lastUsed": "2026-05-06T10:00:00Z"
    }
  ]
}
```

### Generate API Key
```
POST /api-keys
```

**Request:**
```json
{
  "name": "New API Key"
}
```

**Response:** `201 Created`
```json
{
  "id": "key-2",
  "name": "New API Key",
  "key": "sk_test_abc123...",
  "status": "active"
}
```

### Revoke API Key
```
DELETE /api-keys/:id
```

## User Endpoints

### Get Profile
```
GET /users/profile
```

**Response:** `200 OK`
```json
{
  "id": "user-1",
  "email": "user@example.com",
  "fullName": "John Doe",
  "verified": true,
  "createdAt": "2026-01-01T10:00:00Z"
}
```

### Update Profile
```
PUT /users/profile
```

**Request:**
```json
{
  "fullName": "Jane Doe"
}
```

### Change Password
```
POST /users/password
```

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

## Webhook Events

Webhooks are sent for the following events:

- `workflow.created` - Workflow was created
- `workflow.deleted` - Workflow was deleted
- `execution.started` - Execution started
- `execution.completed` - Execution completed
- `execution.failed` - Execution failed
- `agent.created` - Agent was created
- `agent.updated` - Agent was updated

### Register Webhook
```
POST /webhooks
```

**Request:**
```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["execution.completed", "execution.failed"],
  "active": true
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ForgeClient } from '@forge/sdk';

const client = new ForgeClient({
  apiKey: 'sk_test_...',
  baseUrl: 'https://api.forge.ai/v1'
});

// List workflows
const workflows = await client.workflows.list();

// Create workflow
const workflow = await client.workflows.create({
  name: 'My Workflow',
  steps: []
});

// Execute workflow
const execution = await client.workflows.execute(workflow.id, {
  input: {}
});
```

### Python

```python
from forge import ForgeClient

client = ForgeClient(api_key='sk_test_...')

# List workflows
workflows = client.workflows.list()

# Create workflow
workflow = client.workflows.create(
    name='My Workflow',
    steps=[]
)

# Execute workflow
execution = client.workflows.execute(workflow.id)
```

## Pagination

All list endpoints support pagination using `skip` and `limit` parameters:

```
GET /workflows?skip=20&limit=10
```

Response includes `total` count and pagination info.

## Versioning

Current API version is `v1`. Version is specified in the URL path. The API follows semantic versioning and maintains backward compatibility within major versions.

## Support

For API support:
- Email: `support@forge.ai`
- Documentation: `https://docs.forge.ai`
- GitHub: `https://github.com/forgeai/sdk`
