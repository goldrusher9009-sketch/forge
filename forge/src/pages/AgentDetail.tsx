import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import { useFetch } from '../hooks/useFetch';
import { useForm } from '../hooks/useForm';
import '../styles/AgentDetail.css';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: 'active' | 'inactive' | 'testing';
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
}

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: agentData, loading } = useFetch<Agent>(`/api/agents/${id}`);

  const { values, errors, handleChange, handleSubmit } = useForm<{
    name: string;
    description: string;
    model: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
  }>(
    {
      name: '',
      description: '',
      model: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 2048,
    },
    async (data) => {
      try {
        const response = await fetch(`/api/agents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const updated = await response.json();
          setAgent(updated);
          setEditMode(false);
          setAlert({ type: 'success', message: 'Agent updated successfully' });
        } else {
          setAlert({ type: 'error', message: 'Failed to update agent' });
        }
      } catch (err) {
        setAlert({ type: 'error', message: 'Error updating agent' });
      }
    }
  );

  useEffect(() => {
    if (agentData) {
      setAgent(agentData);
      Object.keys(agentData).forEach(key => {
        if (key in values) {
          values[key as keyof typeof values] = agentData[key as keyof Agent] as any;
        }
      });
    }
  }, [agentData]);

  if (loading) return <Loading />;
  if (!agent) return <Alert type="error" message="Agent not found" />;

  return (
    <div className="agent-detail-page">
      <div className="page-header">
        <Button variant="secondary" onClick={() => navigate('/agents')}>
          ← Back
        </Button>
        <div className="flex-1">
          <h1>{agent.name}</h1>
          <p className="subtitle">{agent.description}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <div className="detail-grid">
        <Card>
          <div className="card-header">
            <h2>Configuration</h2>
          </div>
          {editMode ? (
            <form onSubmit={handleSubmit} className="card-body form-grid">
              <Input
                label="Name"
                name="name"
                value={values.name}
                onChange={handleChange}
                error={errors.name}
              />
              <Input
                label="Model"
                name="model"
                value={values.model}
                onChange={handleChange}
                error={errors.model}
              />
              <Input
                label="Temperature"
                name="temperature"
                type="number"
                value={values.temperature}
                onChange={handleChange}
                error={errors.temperature}
                min="0"
                max="2"
                step="0.1"
              />
              <Input
                label="Max Tokens"
                name="maxTokens"
                type="number"
                value={values.maxTokens}
                onChange={handleChange}
                error={errors.maxTokens}
                min="1"
              />
              <div className="full-width">
                <Input
                  label="Description"
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  error={errors.description}
                />
              </div>
              <div className="full-width">
                <label>System Prompt</label>
                <textarea
                  name="systemPrompt"
                  value={values.systemPrompt}
                  onChange={(e) => handleChange({ target: { name: 'systemPrompt', value: e.target.value } } as any)}
                  className="prompt-textarea"
                />
              </div>
              <Button variant="primary" type="submit" className="full-width">
                Save Changes
              </Button>
            </form>
          ) : (
            <div className="card-body">
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`status-badge status-${agent.status}`}>
                  {agent.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Model:</span>
                <span>{agent.model}</span>
              </div>
              <div className="detail-row">
                <span className="label">Temperature:</span>
                <span>{agent.temperature}</span>
              </div>
              <div className="detail-row">
                <span className="label">Max Tokens:</span>
                <span>{agent.maxTokens}</span>
              </div>
              <div className="detail-row">
                <span className="label">System Prompt:</span>
                <pre className="prompt-display">{agent.systemPrompt}</pre>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header">
            <h2>Metadata</h2>
          </div>
          <div className="card-body">
            <div className="detail-row">
              <span className="label">Created:</span>
              <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Updated:</span>
              <span>{new Date(agent.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
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

export default AgentDetail;