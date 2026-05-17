import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { useFetch } from '../hooks/useFetch';
import { useForm } from '../hooks/useForm';
import '../styles/APIKeyManagement.css';

interface APIKey {
  id: string;
  name: string;
  key: string;
  masked: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

const APIKeyManagement: React.FC = () => {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, loading, error } = useFetch<APIKey[]>('/api/keys');

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm<{
    name: string;
    expiresAt?: string;
  }>(
    { name: '', expiresAt: '' },
    async (data) => {
      try {
        const response = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const newKey = await response.json();
          setKeys([...keys, newKey]);
          resetForm();
          setShowCreateForm(false);
          setAlert({ type: 'success', message: 'API key created successfully' });
        } else {
          setAlert({ type: 'error', message: 'Failed to create API key' });
        }
      } catch (err) {
        setAlert({ type: 'error', message: 'Error creating API key' });
      }
    }
  );

  useEffect(() => {
    if (data) {
      setKeys(data);
    }
  }, [data]);

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const response = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setKeys(keys.filter(k => k.id !== id));
        setAlert({ type: 'success', message: 'API key deleted successfully' });
      } else {
        setAlert({ type: 'error', message: 'Failed to delete API key' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Error deleting API key' });
    }
    setDeleteId(null);
  };

  const columns = [
    { header: 'Name', key: 'name' as const },
    { header: 'Key', key: 'masked' as const },
    {
      header: 'Created',
      key: 'createdAt' as const,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      header: 'Last Used',
      key: 'lastUsed' as const,
      render: (date?: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      header: 'Actions',
      key: 'id' as const,
      render: (id: string) => {
        const key = keys.find(k => k.id === id);
        return (
          <div className="action-buttons">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => key && handleCopyKey(key.key, id)}
            >
              {copiedId === id ? '✓ Copied' : 'Copy'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteId(id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) return <Loading />;
  if (error) return <Alert type="error" message={`Error: ${error}`} />;

  return (
    <div className="api-key-management-page">
      <div className="page-header">
        <div>
          <h1>API Keys</h1>
          <p className="subtitle">Manage your API keys and authentication credentials</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '× Close' : '+ Create Key'}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="create-form">
          <div className="card-header">
            <h2>Create New API Key</h2>
          </div>
          <form onSubmit={handleSubmit} className="card-body form-grid">
            <Input
              label="Key Name"
              name="name"
              placeholder="e.g., Production API Key"
              value={values.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Input
              label="Expires At (Optional)"
              name="expiresAt"
              type="date"
              value={values.expiresAt || ''}
              onChange={handleChange}
              error={errors.expiresAt}
            />
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create API Key
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <Table<APIKey>
          columns={columns}
          data={keys}
          loading={false}
        />
      </Card>

      {deleteId && (
        <ConfirmDialog
          title="Delete API Key"
          message="Are you sure you want to delete this API key? Any applications using this key will stop working."
          isDangerous
          onConfirm={() => handleDeleteKey(deleteId)}
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

export default APIKeyManagement;