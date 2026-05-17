# Forge Backend API - Complete Expansion Guide

**Version:** 2.0  
**Date:** May 6, 2026  
**Status:** Design & Implementation

---

## API Architecture Overview

### Core Principles
- RESTful design with consistent naming conventions
- Versioned API endpoints (v1, v2)
- Comprehensive error handling and validation
- Pagination, filtering, sorting on all list endpoints
- Audit logging for all mutations
- Rate limiting per user/role
- Caching strategy for read-heavy operations

### Base URL Structure
```
https://api.forge.yourdomain.com/api/v1/
```

---

## 1. Authentication Endpoints

### POST /auth/register
Register a new user account

```typescript
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp"
}

// Response (201)
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "tier": "free",
  "createdAt": "2026-05-06T00:00:00Z",
  "accessToken": "jwt.token.here",
  "refreshToken": "refresh.token.here"
}
```

### POST /auth/login
Authenticate user and obtain tokens

```typescript
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response (200)
{
  "accessToken": "jwt.access.token",
  "refreshToken": "jwt.refresh.token",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "tier": "premium"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token

```typescript
// Request
{
  "refreshToken": "jwt.refresh.token"
}

// Response (200)
{
  "accessToken": "new.jwt.access.token",
  "expiresIn": 900
}
```

### POST /auth/logout
Invalidate refresh token

```typescript
// Request
{
  "refreshToken": "jwt.refresh.token"
}

// Response (200)
{
  "message": "Logged out successfully"
}
```

### POST /auth/password-reset
Request password reset email

```typescript
// Request
{
  "email": "user@example.com"
}

// Response (200)
{
  "message": "Reset link sent to email"
}
```

### POST /auth/password-reset/:token
Reset password with token

```typescript
// Request
{
  "password": "NewPassword123!"
}

// Response (200)
{
  "message": "Password reset successfully"
}
```

### POST /auth/mfa/setup
Enable two-factor authentication

```typescript
// Request
{}

// Response (200)
{
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEBLW64TMMQ2HY2LT...",
  "backupCodes": ["code1", "code2", "code3", "code4", "code5"]
}
```

### POST /auth/mfa/verify
Verify MFA token and save setup

```typescript
// Request
{
  "token": "123456"
}

// Response (200)
{
  "message": "MFA enabled successfully"
}
```

---

## 2. User Management Endpoints

### GET /users/me
Get current authenticated user profile

```typescript
// Response (200)
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://...",
  "role": "user",
  "tier": "premium",
  "status": "active",
  "createdAt": "2026-01-01T00:00:00Z",
  "lastLoginAt": "2026-05-06T00:00:00Z",
  "settings": {
    "emailNotifications": true,
    "darkMode": false,
    "language": "en"
  }
}
```

### PUT /users/me
Update current user profile

```typescript
// Request
{
  "firstName": "Jane",
  "lastName": "Smith",
  "settings": {
    "emailNotifications": false
  }
}

// Response (200)
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "settings": {
    "emailNotifications": false,
    "darkMode": false,
    "language": "en"
  }
}
```

### GET /users
List all users (admin only) with pagination

```typescript
// Query Parameters
GET /users?page=1&limit=20&role=user&status=active&sortBy=createdAt&order=desc

// Response (200)
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "role": "user",
      "tier": "premium",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### GET /users/:id
Get specific user details (admin only)

```typescript
// Response (200)
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "tier": "premium",
  "status": "active",
  "createdAt": "2026-01-01T00:00:00Z",
  "subscriptionStatus": "active",
  "usage": {
    "workflows": 45,
    "agents": 12,
    "executions": 1234
  }
}
```

### PUT /users/:id
Update user (admin only)

```typescript
// Request
{
  "status": "suspended",
  "tier": "enterprise"
}

// Response (200)
{
  "id": "uuid",
  "status": "suspended",
  "tier": "enterprise"
}
```

### DELETE /users/:id
Delete user account (admin only)

```typescript
// Response (204 No Content)
```

---

## 3. Workflow Endpoints

### POST /workflows
Create new workflow

```typescript
// Request
{
  "name": "Data Processing Pipeline",
  "description": "Process daily data exports",
  "steps": [
    {
      "id": "step-1",
      "type": "agent",
      "name": "Data Fetcher",
      "config": {
        "agentId": "agent-123",
        "inputs": ["sourceUrl"]
      }
    },
    {
      "id": "step-2",
      "type": "action",
      "name": "Transform Data",
      "config": {
        "action": "map_fields",
        "mapping": { "source": "destination" }
      }
    }
  ],
  "triggers": ["schedule-daily-9am", "manual"],
  "tags": ["production", "data-processing"]
}

// Response (201)
{
  "id": "workflow-uuid",
  "name": "Data Processing Pipeline",
  "description": "Process daily data exports",
  "status": "active",
  "version": 1,
  "steps": [...],
  "triggers": [...],
  "createdAt": "2026-05-06T00:00:00Z",
  "updatedAt": "2026-05-06T00:00:00Z"
}
```

### GET /workflows
List workflows with filtering

```typescript
// Query Parameters
GET /workflows?status=active&tags=production&sortBy=updatedAt&search=data

// Response (200)
{
  "data": [
    {
      "id": "workflow-uuid",
      "name": "Data Processing Pipeline",
      "status": "active",
      "version": 1,
      "executionCount": 234,
      "lastExecutedAt": "2026-05-05T14:30:00Z",
      "createdAt": "2026-05-06T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### GET /workflows/:id
Get workflow details

```typescript
// Response (200)
{
  "id": "workflow-uuid",
  "name": "Data Processing Pipeline",
  "description": "Process daily data exports",
  "status": "active",
  "version": 1,
  "steps": [...],
  "triggers": [...],
  "executionStats": {
    "totalExecutions": 234,
    "successfulExecutions": 230,
    "failedExecutions": 4,
    "averageDuration": 45000,
    "lastExecutedAt": "2026-05-05T14:30:00Z"
  },
  "createdAt": "2026-05-06T00:00:00Z",
  "updatedAt": "2026-05-06T00:00:00Z"
}
```

### PUT /workflows/:id
Update workflow

```typescript
// Request
{
  "name": "Updated Pipeline Name",
  "status": "paused"
}

// Response (200)
{
  "id": "workflow-uuid",
  "version": 2,
  "name": "Updated Pipeline Name",
  "status": "paused"
}
```

### DELETE /workflows/:id
Delete workflow

```typescript
// Response (204 No Content)
```

### POST /workflows/:id/execute
Execute workflow manually

```typescript
// Request
{
  "inputs": {
    "sourceUrl": "https://example.com/data"
  },
  "priority": "high"
}

// Response (202 Accepted)
{
  "executionId": "exec-uuid",
  "workflowId": "workflow-uuid",
  "status": "queued",
  "createdAt": "2026-05-06T00:00:00Z"
}
```

### GET /workflows/:id/executions
Get workflow execution history

```typescript
// Query Parameters
GET /workflows/:id/executions?status=completed&sortBy=createdAt&limit=50

// Response (200)
{
  "data": [
    {
      "id": "exec-uuid",
      "workflowId": "workflow-uuid",
      "status": "completed",
      "startedAt": "2026-05-05T14:30:00Z",
      "completedAt": "2026-05-05T14:45:30Z",
      "duration": 930000,
      "result": {
        "status": "success",
        "outputData": {}
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "pages": 5
  }
}
```

---

## 4. Agent Endpoints

### POST /agents
Create new agent

```typescript
// Request
{
  "name": "Data Fetcher Agent",
  "description": "Fetches data from external APIs",
  "type": "http-client",
  "config": {
    "baseUrl": "https://api.example.com",
    "timeout": 30000,
    "retryAttempts": 3
  },
  "tags": ["production", "integration"]
}

// Response (201)
{
  "id": "agent-uuid",
  "name": "Data Fetcher Agent",
  "type": "http-client",
  "status": "active",
  "createdAt": "2026-05-06T00:00:00Z"
}
```

### GET /agents
List agents

```typescript
// Query Parameters
GET /agents?type=http-client&status=active&search=fetcher

// Response (200)
{
  "data": [
    {
      "id": "agent-uuid",
      "name": "Data Fetcher Agent",
      "type": "http-client",
      "status": "active",
      "executionCount": 1234,
      "successRate": 99.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

### GET /agents/:id
Get agent details

```typescript
// Response (200)
{
  "id": "agent-uuid",
  "name": "Data Fetcher Agent",
  "type": "http-client",
  "description": "Fetches data from external APIs",
  "status": "active",
  "config": {...},
  "capabilities": [...],
  "executionStats": {
    "totalExecutions": 1234,
    "successfulExecutions": 1230,
    "failedExecutions": 4,
    "averageDuration": 2500
  },
  "createdAt": "2026-05-06T00:00:00Z"
}
```

### PUT /agents/:id
Update agent

```typescript
// Request
{
  "description": "Updated description",
  "config": {
    "timeout": 60000
  }
}

// Response (200)
{
  "id": "agent-uuid",
  "description": "Updated description"
}
```

### DELETE /agents/:id
Delete agent

```typescript
// Response (204 No Content)
```

### POST /agents/:id/execute
Execute agent directly

```typescript
// Request
{
  "inputs": {
    "url": "https://api.example.com/data"
  }
}

// Response (200)
{
  "result": {
    "status": "success",
    "output": {...},
    "duration": 2345
  }
}
```

### GET /agents/:id/logs
Get agent execution logs

```typescript
// Query Parameters
GET /agents/:id/logs?level=error&limit=100

// Response (200)
{
  "data": [
    {
      "timestamp": "2026-05-06T00:00:00Z",
      "level": "error",
      "message": "Connection timeout",
      "executionId": "exec-uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 25
  }
}
```

---

## 5. Execution Endpoints

### GET /executions
List all executions

```typescript
// Query Parameters
GET /executions?status=failed&startDate=2026-05-01&endDate=2026-05-06&sortBy=createdAt

// Response (200)
{
  "data": [
    {
      "id": "exec-uuid",
      "workflowId": "workflow-uuid",
      "status": "failed",
      "startedAt": "2026-05-05T14:30:00Z",
      "completedAt": "2026-05-05T14:45:30Z",
      "duration": 930000,
      "error": "Agent timeout"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 234
  }
}
```

### GET /executions/:id
Get execution details

```typescript
// Response (200)
{
  "id": "exec-uuid",
  "workflowId": "workflow-uuid",
  "status": "completed",
  "startedAt": "2026-05-05T14:30:00Z",
  "completedAt": "2026-05-05T14:45:30Z",
  "duration": 930000,
  "steps": [
    {
      "id": "step-1",
      "status": "completed",
      "startedAt": "2026-05-05T14:30:00Z",
      "completedAt": "2026-05-05T14:35:00Z",
      "output": {...}
    }
  ],
  "result": {
    "status": "success",
    "outputData": {}
  }
}
```

### POST /executions/:id/cancel
Cancel running execution

```typescript
// Response (200)
{
  "id": "exec-uuid",
  "status": "cancelled"
}
```

### GET /executions/:id/logs
Get execution logs

```typescript
// Query Parameters
GET /executions/:id/logs?stepId=step-1&level=all

// Response (200)
{
  "data": [
    {
      "timestamp": "2026-05-05T14:30:00Z",
      "level": "info",
      "message": "Step started",
      "stepId": "step-1"
    }
  ]
}
```

---

## 6. Analytics & Metrics Endpoints

### GET /analytics/dashboard
Get dashboard metrics

```typescript
// Response (200)
{
  "overview": {
    "totalWorkflows": 45,
    "activeWorkflows": 38,
    "totalExecutions": 2345,
    "successRate": 98.5,
    "totalAgents": 12,
    "activeAgents": 11
  },
  "timeSeries": {
    "executionsPerDay": [...],
    "successRatePerDay": [...],
    "averageDurationPerDay": [...]
  },
  "topWorkflows": [...],
  "recentFailures": [...]
}
```

### GET /analytics/workflows
Workflow analytics

```typescript
// Query Parameters
GET /analytics/workflows?period=7d

// Response (200)
{
  "totalExecutions": 234,
  "successRate": 98.5,
  "averageDuration": 45000,
  "peakHour": "14:00",
  "topErrors": [...]
}
```

### GET /analytics/agents
Agent performance analytics

```typescript
// Response (200)
{
  "agents": [
    {
      "id": "agent-uuid",
      "name": "Data Fetcher",
      "executionCount": 1234,
      "successRate": 99.5,
      "averageDuration": 2500,
      "errorRate": 0.5
    }
  ]
}
```

---

## Error Responses

### Standard Error Format

```typescript
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is required",
    "details": {
      "field": "email",
      "reason": "missing"
    },
    "timestamp": "2026-05-06T00:00:00Z",
    "requestId": "req-uuid"
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_INPUT | 400 | Input validation failed |
| AUTHENTICATION_FAILED | 401 | Invalid credentials |
| PERMISSION_DENIED | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1620000000
```

---

## Implementation Checklist

- [ ] Create authentication endpoints
- [ ] Implement user management endpoints
- [ ] Build workflow CRUD endpoints
- [ ] Create agent management endpoints
- [ ] Build execution tracking endpoints
- [ ] Implement analytics endpoints
- [ ] Add pagination to all list endpoints
- [ ] Implement filtering and sorting
- [ ] Add comprehensive error handling
- [ ] Create input validation for all endpoints
- [ ] Implement rate limiting
- [ ] Add audit logging for mutations
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Implement caching strategy
- [ ] Create webhook system

