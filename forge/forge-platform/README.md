# Forge Platform - Node.js Backend

Core REST API backend for the Forge distributed multi-agent platform. Built with Express.js, TypeScript, and designed for scalability and extensibility.

## Features

- **Express.js REST API** with full TypeScript support
- **Agent Management** - Register, query, and manage AI agents with capability-based filtering
- **Workflow Orchestration** - Define, execute, and monitor complex workflows
- **Task Queue** - Enqueue, track, and cancel tasks with real-time status updates
- **Authentication & Authorization** - JWT-based auth with role-based access control (RBAC)
- **Error Handling** - Centralized error handling with consistent API response format
- **Type Safety** - Full TypeScript strict mode compilation
- **Development Tools** - Hot reload with nodemon, linting with ESLint, formatting with Prettier

## Project Structure

```
src/
├── index.ts                 # Express app entry point
├── config/
│   └── index.ts            # Configuration management (env variables)
├── types/
│   └── index.ts            # TypeScript type definitions
├── api/
│   ├── middleware/
│   │   ├── auth.ts         # JWT authentication middleware
│   │   └── errorHandler.ts # Centralized error handling
│   └── routes/
│       ├── index.ts        # Main API router
│       ├── agents.ts       # Agent CRUD endpoints
│       ├── workflows.ts    # Workflow CRUD endpoints
│       └── queue.ts        # Task queue endpoints
└── core/
    ├── agents/
    │   └── registry.ts     # Agent lifecycle management
    └── queue/
        └── executor.ts     # Task execution engine
```

## Quick Start

### Prerequisites

- Node.js 18+ (with npm or yarn)
- TypeScript 5.0+

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Verify TypeScript compilation
npm run build
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Run in separate terminal for tests
npm run test:watch
```

The API will be available at `http://localhost:3000/api`

### Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check
- `GET /` - Root health check
- `GET /api/health` - API health status

### Agents
- `GET /api/agents` - Get all agents
- `GET /api/agents/:id` - Get agent by ID
- `POST /api/agents` - Create agent (protected)
- `PUT /api/agents/:id` - Update agent (protected)
- `DELETE /api/agents/:id` - Delete agent (protected)

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `POST /api/workflows` - Create workflow (protected)
- `PUT /api/workflows/:id` - Update workflow (protected)
- `DELETE /api/workflows/:id` - Delete workflow (protected)

### Queue
- `GET /api/queue` - Get queue status and statistics
- `GET /api/queue/:id` - Get task by ID
- `POST /api/queue` - Enqueue new task (protected)
- `POST /api/queue/:id/cancel` - Cancel task (protected)

## Environment Variables

See `.env.example` for all available configuration options:

```
PORT=3000                    # API server port
HOST=localhost              # Bind address
NODE_ENV=development        # Environment (development|production)
DB_HOST=localhost           # Database host
DB_PORT=5432               # Database port
DB_NAME=forge_db           # Database name
DB_USER=forge_user         # Database user
REDIS_HOST=localhost       # Redis host
REDIS_PORT=6379           # Redis port
JWT_SECRET=your-secret-key # JWT signing secret
LOG_LEVEL=info            # Logging level
```

## Development Commands

```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled JavaScript
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # Check code style
npm run format       # Auto-format code
```

## Type System

All API responses follow a consistent pattern with `ApiResponse<T>` generic type:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
```

Error responses include additional fields:

```typescript
{
  success: false;
  error: string;
  code: string;
  statusCode: number;
  timestamp: Date;
}
```

## Authentication

Protected endpoints require an `Authorization` header with a Bearer token:

```bash
Authorization: Bearer <token>
```

## Next Steps

1. Install npm dependencies: `npm install`
2. Start development server: `npm run dev`
3. Test endpoints with Postman or curl
4. Connect database for persistent storage
5. Implement workflow execution engine
6. Add agent provider integrations (OpenAI, Anthropic, etc.)

## Contributing

- Format code before commit: `npm run format`
- Run linter: `npm run lint`
- Ensure tests pass: `npm run test`

## License

ISC
