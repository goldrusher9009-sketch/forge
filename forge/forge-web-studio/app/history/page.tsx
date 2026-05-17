'use client';

import { useState, useCallback } from 'react';
import { Layout, Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Spinner } from '@/components';
import { Task, TaskStatus } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { useApi } from '@/lib/hooks';
import { API_ENDPOINTS } from '@/lib/constants';

interface ExecutionHistory extends Task {
  workflowName: string;
  duration: number;
  stepCount: number;
}

interface HistoryResponse {
  executions: ExecutionHistory[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
  };
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('7d');

  const { data: historyData, loading, error, refetch } = useApi<HistoryResponse>(
    `${API_ENDPOINTS.HISTORY}?dateFilter=${dateFilter}`,
    { autoFetch: true }
  );

  const executions = historyData?.executions || [];

  const filteredExecutions = executions.filter(exec =>
    exec.id.includes(searchTerm) || exec.workflowName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = historyData?.stats || {
    total: 0,
    successful: 0,
    failed: 0,
    avgDuration: 0,
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Execution History</h1>
          <p className="mt-2 text-gray-600">Review detailed logs and analytics from previous workflow executions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-sm text-gray-600 mt-1">Total Executions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                <p className="text-sm text-gray-600 mt-1">Successful</p>
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
                <div className="text-2xl font-bold text-blue-600">{stats.avgDuration}ms</div>
                <p className="text-sm text-gray-600 mt-1">Avg Duration</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by workflow name or execution ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button
              variant={dateFilter === '24h' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDateFilter('24h')}
            >
              Last 24h
            </Button>
            <Button
              variant={dateFilter === '7d' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDateFilter('7d')}
            >
              Last 7d
            </Button>
            <Button
              variant={dateFilter === '30d' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDateFilter('30d')}
            >
              Last 30d
            </Button>
            <Button
              variant={dateFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDateFilter('all')}
            >
              All
            </Button>
          </div>
        </div>

        {/* Executions Table */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="primary" onClick={refetch}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredExecutions.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Executed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExecutions.map(execution => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{execution.workflowName}</div>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1">{execution.id}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={execution.status} />
                      </TableCell>
                      <TableCell>{execution.stepCount}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{execution.duration}ms</span>
                      </TableCell>
                      <TableCell>{formatDateTime(execution.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No execution history found</p>
                <p className="text-sm text-gray-500">Workflow executions will be tracked and displayed here</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Execution Time</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">2.3s</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Median Execution Time</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">1.8s</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Peak Duration</p>
                  <p className="text-lg font-semibold text-red-600 mt-1">15.2s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reliability Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: '98.5%' }} />
                  </div>
                  <p className="text-sm font-semibold text-green-600 mt-1">98.5%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Failure Rate</p>
                  <p className="text-sm font-semibold text-red-600 mt-1">1.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
