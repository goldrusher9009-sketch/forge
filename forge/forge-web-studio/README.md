# Forge Web Studio

A modern Next.js web application for managing AI agents, workflows, and task orchestration.

## Overview

Forge Web Studio is the user interface for the Forge platform, providing a comprehensive dashboard for:
- **Agent Management**: Create, configure, and manage AI agents with custom system prompts, models, and tools
- **Workflow Design**: Build multi-step workflows with conditional logic and error handling
- **Task Queue Monitoring**: Real-time monitoring of task execution with status updates and performance metrics
- **Execution History**: Detailed tracking and analysis of workflow executions with performance analytics

## Tech Stack

- **Framework**: Next.js 16.2.4 with App Router
- **Language**: TypeScript
- **UI Components**: Custom React components with Tailwind CSS
- **Styling**: Tailwind CSS 4 with utility-first approach
- **State Management**: React hooks (useState, useCallback, useEffect)
- **HTTP Client**: Native fetch API with custom hooks

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn package manager

### Installation

1. Clone the repository and navigate to the directory
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checker

## Features

### Dashboard (/)
- Overview statistics: Active Workflows, Completed Tasks, Queued Tasks
- Quick links to key features
- Feature cards describing capabilities

### Agents Management (/agents)
- Create new AI agents with configuration
- Define system prompts, models, and parameters
- Manage temperature and max tokens settings
- Assign tools to agents
- View and delete agents

### Workflows (/workflows)
- Design multi-step workflows
- Conditional logic support
- Error handling configuration
- Enable/disable workflows
- Track workflow versions

### Task Queue (/queue)
- Real-time queue status monitoring
- Task filtering by status
- Progress tracking for running tasks
- Queue statistics and metrics
- Cancel running tasks

### Execution History (/history)
- Search executions by workflow name or ID
- Filter by date range
- View detailed execution logs
- Performance analytics
- Reliability metrics

## Project Structure

```
app/
├── api/                    # API route handlers
├── components/             # Reusable UI components
├── agents/                 # Agents management page
├── workflows/              # Workflows management page
├── queue/                  # Task queue page
├── history/                # Execution history page
└── page.tsx               # Home/dashboard page

lib/
├── hooks/                  # Custom React hooks
├── types.ts               # Type definitions
├── constants.ts           # Application constants
└── utils.ts              # Utility functions
```

## Component Library

### Layout & Navigation
- `Layout` - Main page layout wrapper
- `Navigation` - Top navigation bar

### Form Components
- `Button`, `Input`, `Textarea`, `Select`, `Modal`

### Data Display
- `Card`, `Table`, `Badge`, `StatusBadge`

### Loading States
- `Spinner`, `LoadingOverlay`, `Skeleton`

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
DATABASE_URL=postgresql://user:password@localhost:5432/forge_web_studio
NEXT_PUBLIC_ENABLE_AGENT_CREATION=true
NEXT_PUBLIC_ENABLE_WORKFLOW_CREATION=true
NEXT_PUBLIC_ENABLE_QUEUE_MONITORING=true
NEXT_PUBLIC_ENABLE_HISTORY_TRACKING=true
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
