import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { useFetch } from '../hooks/useFetch';
import '../styles/AgentList.css';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'testing';
  model: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
}

const AgentList: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { data, loading, error } = useFetch<Agent[]>('/api/agents');

  useEffect(() => {
    if (data) {
      setAgents(data);
    }
  }, [data]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAgents(agents.filter(a => a.id !== id));
        setAlert({ type: 'success', message: 'Agent deleted successfully' });
      } else {
        setAlert({ type: 'error', message: 'Failed to delete agent' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Error deleting agent' });
    }
    setDeleteId(null);
  };

  const columns = [
    { header: 'Name', key: 'name' as const },
    { header: 'Description', key: 'description' as const },
    { header: 'Model', key: 'model' as const },
    {
      header: 'Status',
      key: 'status' as const,
      render: (status: string) => <span className={`status-badge status-${status}`}>{status}</span>,
    },
    {
      header: 'Tasks',
      key: 'taskCount' as const,
    },
    {
      header: 'Actions',
      key: 'id' as const,
      render: (id: string) => (
        <div className="action-buttons">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/agents/${id}`)}
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/agents/${id}/edit`)}
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
    <div className="agent-list-page">
      <div className="page-header">
        <div>
          <h1>Agents</h1>
          <p className="subtitle">Manage your AI agents and their configurations</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/agents/new')}
        >
          + Create Agent
        </Button>
      </div>

      <Card>
        <Table<Agent>
          columns={columns}
          data={agents}
          onRowClick={(agent) => navigate(`/agents/${agent.id}`)}
        />
      </Card>

      {deleteId && (
        <ConfirmDialog
          title="Delete Agent"
          message="Are you sure you want to delete this agent? This action cannot be undone."
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

export default AgentList;