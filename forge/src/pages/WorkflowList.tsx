import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { useFetch } from '../hooks/useFetch';
import '../styles/WorkflowList.css';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  executionCount: number;
  successRate: number;
}

const WorkflowList: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { data, loading, error, refetch } = useFetch<Workflow[]>('/api/workflows');

  useEffect(() => {
    if (data) {
      setWorkflows(data);
    }
  }, [data]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setWorkflows(workflows.filter(w => w.id !== id));
        setAlert({ type: 'success', message: 'Workflow deleted successfully' });
      } else {
        setAlert({ type: 'error', message: 'Failed to delete workflow' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Error deleting workflow' });
    }
    setDeleteId(null);
  };

  const columns = [
    { header: 'Name', key: 'name' as const },
    { header: 'Description', key: 'description' as const },
    {
      header: 'Status',
      key: 'status' as const,
      render: (status: string) => <span className={`status-badge status-${status}`}>{status}</span>,
    },
    {
      header: 'Success Rate',
      key: 'successRate' as const,
      render: (rate: number) => `${rate}%`,
    },
    {
      header: 'Executions',
      key: 'executionCount' as const,
    },
    {
      header: 'Actions',
      key: 'id' as const,
      render: (id: string) => (
        <div className="action-buttons">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/workflows/${id}`)}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/workflows/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteId(id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Loading />;
  if (error) return <Alert type="error" message={`Error: ${error}`} />;

  return (
    <div className="workflow-list-page">
      <div className="page-header">
        <div>
          <h1>Workflows</h1>
          <p className="subtitle">Manage and execute your automation workflows</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/workflows/new')}
        >
          + Create Workflow
        </Button>
      </div>

      <Card>
        <Table<Workflow>
          columns={columns}
          data={workflows}
          onRowClick={(workflow) => navigate(`/workflows/${workflow.id}`)}
        />
      </Card>

      {deleteId && (
        <ConfirmDialog
          title="Delete Workflow"
          message="Are you sure you want to delete this workflow? This action cannot be undone."
          isDangerous
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
};

export default WorkflowList;