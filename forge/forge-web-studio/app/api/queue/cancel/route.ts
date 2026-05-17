import { NextRequest, NextResponse } from 'next/server';
import { Task, TaskStatus } from '@/lib/types';

// Mock database - TODO: Replace with actual database
const tasks: Map<string, Task> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = tasks.get(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.status !== TaskStatus.Running && task.status !== TaskStatus.Queued) {
      return NextResponse.json(
        { error: 'Can only cancel running or queued tasks' },
        { status: 400 }
      );
    }

    const cancelledTask: Task = {
      ...task,
      status: TaskStatus.Cancelled,
      updatedAt: new Date(),
    };

    tasks.set(taskId, cancelledTask);

    return NextResponse.json(cancelledTask);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cancel task' },
      { status: 500 }
    );
  }
}
