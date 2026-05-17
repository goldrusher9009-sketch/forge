import { NextResponse } from 'next/server';
import { TaskStatus } from '@/lib/types';

interface DashboardStats {
  activeWorkflows: number;
  completedTasks: number;
  queuedTasks: number;
}

export async function GET() {
  try {
    // Mock data - in production, would query actual database
    // This simulates aggregating data from workflows and queue
    
    const workflowsData = new Map([
      ['wf-001', { id: 'wf-001', name: 'Data Processing', enabled: true }],
      ['wf-002', { id: 'wf-002', name: 'Email Automation', enabled: true }],
      ['wf-003', { id: 'wf-003', name: 'Report Generation', enabled: false }],
      ['wf-004', { id: 'wf-004', name: 'Data Validation', enabled: true }],
      ['wf-005', { id: 'wf-005', name: 'API Integration', enabled: true }],
    ]);

    const tasksData = new Map([
      ['task-001', { id: 'task-001', status: TaskStatus.Completed, progress: 100 }],
      ['task-002', { id: 'task-002', status: TaskStatus.Completed, progress: 100 }],
      ['task-003', { id: 'task-003', status: TaskStatus.Completed, progress: 100 }],
      ['task-004', { id: 'task-004', status: TaskStatus.Queued, progress: 0 }],
      ['task-005', { id: 'task-005', status: TaskStatus.Queued, progress: 0 }],
      ['task-006', { id: 'task-006', status: TaskStatus.Running, progress: 45 }],
    ]);

    const activeWorkflows = Array.from(workflowsData.values()).filter(wf => wf.enabled).length;
    const completedTasks = Array.from(tasksData.values()).filter(t => t.status === TaskStatus.Completed).length;
    const queuedTasks = Array.from(tasksData.values()).filter(t => t.status === TaskStatus.Queued).length;

    const stats: DashboardStats = {
      activeWorkflows,
      completedTasks,
      queuedTasks,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
