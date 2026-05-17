import { Task, TaskStatus, Workflow } from '../../types';

export class TaskExecutor {
  static async execute(task: Task, workflow: Workflow): Promise<void> {
    try {
      // Update task status to running
      task.status = TaskStatus.Running;
      task.startedAt = new Date();
      task.progress = 0;

      // Execute workflow steps
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        task.progress = Math.round(((i + 1) / workflow.steps.length) * 100);

        // Simulate step execution
        await this.executeStep(step, task);
      }

      // Mark as completed
      task.status = TaskStatus.Completed;
      task.completedAt = new Date();
      task.progress = 100;
    } catch (error) {
      task.status = TaskStatus.Failed;
      task.completedAt = new Date();
      task.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private static async executeStep(step: any, task: Task): Promise<void> {
    // Simulate async step execution
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Executing step: ${step.name}`);
        resolve();
      }, 1000);
    });
  }
}

export default TaskExecutor;
