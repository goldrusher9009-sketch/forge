import { NextRequest, NextResponse } from 'next/server';
import { Task, TaskStatus } from '@/lib/types';

interface ExecutionHistory extends Task {
  workflowName: string;
  duration: number;
  stepCount: number;
}

// Mock database for executions
const executions = new Map<string, ExecutionHistory>([
  [
    'exec-001',
    {
      id: 'exec-001',
      status: TaskStatus.Completed,
      progress: 100,
      createdAt: new Date('2026-05-03'),
      updatedAt: new Date('2026-05-03'),
      workflowName: 'Data Processing Pipeline',
      duration: 2300,
      stepCount: 5,
    },
  ],
  [
    'exec-002',
    {
      id: 'exec-002',
      status: TaskStatus.Completed,
      progress: 100,
      createdAt: new Date('2026-05-02'),
      updatedAt: new Date('2026-05-02'),
      workflowName: 'Report Generation',
      duration: 1800,
      stepCount: 3,
    },
  ],
  [
    'exec-003',
    {
      id: 'exec-003',
      status: TaskStatus.Failed,
      progress: 60,
      createdAt: new Date('2026-05-02'),
      updatedAt: new Date('2026-05-02'),
      workflowName: 'Data Processing Pipeline',
      duration: 4500,
      stepCount: 5,
    },
  ],
  [
    'exec-004',
    {
      id: 'exec-004',
      status: TaskStatus.Completed,
      progress: 100,
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
      workflowName: 'Email Notification',
      duration: 900,
      stepCount: 2,
    },
  ],
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter') || '7d';

    // Filter executions by date
    const now = new Date();
    let cutoffDate = new Date();

    switch (dateFilter) {
      case '24h':
        cutoffDate.setHours(cutoffDate.getHours() - 24);
        break;
      case '7d':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case 'all':
        cutoffDate = new Date(0);
        break;
    }

    const filteredExecutions = Array.from(executions.values())
      .filter((exec) => exec.createdAt >= cutoffDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate statistics
    const stats = {
      total: filteredExecutions.length,
      successful: filteredExecutions.filter(
        (e) => e.status === TaskStatus.Completed
      ).length,
      failed: filteredExecutions.filter((e) => e.status === TaskStatus.Failed)
        .length,
      avgDuration:
        filteredExecutions.length > 0
          ? Math.round(
              filteredExecutions.reduce((sum, e) => sum + e.duration, 0) /
                filteredExecutions.length
            )
          : 0,
    };

    return NextResponse.json({
      executions: filteredExecutions,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch execution history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution history' },
      { status: 500 }
    );
  }
}
