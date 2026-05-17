import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import Table from '../components/Table';
import { useFetch } from '../hooks/useFetch';
import { useForm } from '../hooks/useForm';
import '../styles/WorkflowDetail.css';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface Execution {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: string;
  endTime: string;
  duration: number;
  errorMessage?: string;
}

const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: workflowData, loading } = useFetch<Workflow>(`/api/workflows/${id}`);
  const { data: executionsData } = useFetch<Execution[]>(`/api/workflows/${id}/executions`);

  const { values, errors, handleChange, handleSubmit } = useForm<{
    name: string;
    description: string;
  }>(
    { name: '', description: '' },
    async (data) => {
      try {
        const response = await fetch(`/api/workflows/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const updated = await response.json();
          setWorkflow(updated);
          setEditMode(false);
          setAlert({ type: 'success', message: 'Workflow updated successfully' });
        } else {
          setAlert({ type: 'error', message: 'Failed to update workflow' });
        }
      } catch (err) {
        setAlert({ type: 'error', message: 'Error updating workflow' });
      }
    }
  );

  useEffect(() => {
    if (workflowData) {
      setWorkflow(workflowData);
      values.name = workflowData.name;
      values.description = workflowData.description;
    }
  }, [workflowData]);

  useEffect(() => {
    if (executionsData) {
      setExecutions(executionsData);
    }
  }, [executionsData]);

  const handleExecute = async () => {
    try {
      const response = await fetch(`/api/workflows/${id}/execute`, { method: 'POST' });
      if (response.ok) {
        setAlert({ type: 'success', message: 'Workflow executed successfully' });
      } else {
        setAlert({ type: 'error', message: 'Failed to execute workflow' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Error executing workflow' });
    }
  };

  if (loading) return <Loading />;
  if (!workflow) return <Alert type="error" message="Workflow not found" />;

  const executionColumns = [
    { header: 'Status', key: 'status' as const },
    { header: 'Started', key: 'startTime' as const },
    { header: 'Duration', key: 'duration' as const, render: (d: number) => `${d}ms` },
    {
      header: 'Details',
      key: 'id' as const,
      render: (id: string) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/workflows/${workflow.id}/executions/${id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="workflow-detail-page">
      <div className="page-header">
        <Button variant="secondary" onClick={() => navigate('/workflows')}>
          ← Back
        </Button>
        <div className="flex-1">
          <h1>{workflow.name}</h1>
          <p className="subtitle">{workflow.description}</p>
        </div>
        <Button variant="primary" onClick={handleExecute}>
          ▶ Execute
        </Button>
      </div>

      <div className="detail-grid">
        <Card>
          <div className="card-header">
            <h2>Workflow Details</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          {editMode ? (
            <form onSubmit={handleSubmit} className="card-body">
              <Input
                label="Name"
                name="name"
                value={values.name}
                onChange={handleChange}
                error={errors.name}
              />
              <Input
                label="Description"
                name="description"
                value={values.description}
                onChange={handleChange}
                error={errors.description}
              />
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </form>
          ) : (
            <div className="card-body">
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`status-badge status-${workflow.status}`}>
                  {workflow.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Created:</span>
                <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Updated:</span>
                <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header">
            <h2>Execution History</h2>
          </div>
          <Table<Execution>
            columns={executionColumns}
            data={executions}
            loading={false}
          />
        </Card>
      </div>

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

export default WorkflowDetail;