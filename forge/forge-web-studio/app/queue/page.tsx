'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layout, Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Spinner } from '@/components';
import { Task, TaskStatus, QueueStatus } from '@/lib/types';
import { formatDateTime, formatDuration } from '@/lib/utils';
import { useApi, apiCall } from '@/lib/hooks';
import { API_ENDPOINTS, POLLING } from '@/lib/constants';

interface QueueResponse {
  tasks: Task[];
  status: QueueStatus;
  stats: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
}

export default function QueuePage() {
  const { data: queueData, loading, error, refetch } = useApi<QueueResponse>(
    API_ENDPOINTS.QUEUE,
    { autoFetch: true }
  );
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  // Poll queue status at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, POLLING.QUEUE_STATUS);

    return () => clearInterval(interval);
  }, [refetch]);

  const tasks = queueData?.tasks || [];

  const filteredTasks = tasks.filter(task =>
    filter === 'all' || task.status === filter
  );

  const stats = {
    queued: tasks.filter(t => t.status === TaskStatus.Queued).length,
    running: tasks.filter(t => t.status === TaskStatus.Running).length,
    completed: tasks.filter(t => t.status === TaskStatus.Completed).length,
    failed: tasks.filter(t => t.status === TaskStatus.Failed).length,
    cancelled: tasks.filter(t => t.status === TaskStatus.Cancelled).length,
  };

  const handleCancelTask = useCallback(async (id: string) => {
    try {
      await apiCall(`${API_ENDPOINTS.QUEUE}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ taskId: id }),
      });
      await refetch();
    } catch (err) {
      console.error('Failed to cancel task:', err);
    }
  }, [refetch]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Queue</h1>
          <p className="mt-2 text-gray-600">Monitor and manage task execution with real-time updates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.queued}</div>
                <p className="text-sm text-gray-600 mt-1">Queued</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.running}</div>
                <p className="text-sm text-gray-600 mt-1">Running</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-gray-600 mt-1">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-sm text-gray-600 mt-1">Failed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
                <p className="text-sm text-gray-600 mt-1">Cancelled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Tasks
          </Button>
          <Button
            variant={filter === TaskStatus.Queued ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(TaskStatus.Queued)}
          >
            Queued
          </Button>
          <Button
            variant={filter === TaskStatus.Running ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(TaskStatus.Running)}
          >
            Running
          </Button>
          <Button
            variant={filter === TaskStatus.Completed ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(TaskStatus.Completed)}
          >
            Completed
          </Button>
          <Button
            variant={filter === TaskStatus.Failed ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(TaskStatus.Failed)}
          >
            Failed
          </Button>
        </div>

        {/* Tasks Table */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            </CardContent>
          </Card>
        ) : filteredTasks.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{task.id}</code>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{task.progress}%</span>
                      </TableCell>
                      <TableCell>{formatDateTime(task.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {task.status === TaskStatus.Running || task.status === TaskStatus.Queued ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelTask(task.id)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No tasks in queue</p>
                <p className="text-sm text-gray-500">Tasks will appear here as workflows are executed</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue Information */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">2.5s</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Throughput</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">24 tasks/min</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-lg font-semibold text-green-600 mt-1">98.5%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Queue Capacity</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">10,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
