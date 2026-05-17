import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Dashboard.css';

interface DashboardStats {
  workflowCount: number;
  agentCount: number;
  executionCount: number;
  successRate: number;
}

interface RecentActivity {
  id: string;
  type: 'workflow' | 'agent' | 'execution';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    workflowCount: 0,
    agentCount: 0,
    executionCount: 0,
    successRate: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Simulate API call to fetch dashboard statistics
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock data - in production, this would come from the API
        setStats({
          workflowCount: 12,
          agentCount: 8,
          executionCount: 156,
          successRate: 94.2,
        });

        setActivities([
          {
            id: '1',
            type: 'workflow',
            title: 'Data Processing Workflow',
            description: 'Completed successfully',
            timestamp: '2 hours ago',
            status: 'success',
          },
          {
            id: '2',
            type: 'agent',
            title: 'Support Agent Configuration',
            description: 'Updated system prompt',
            timestamp: '5 hours ago',
            status: 'success',
          },
          {
            id: '3',
            type: 'execution',
            title: 'Email Campaign Execution',
            description: 'In progress - 75% complete',
            timestamp: '30 minutes ago',
            status: 'pending',
          },
          {
            id: '4',
            type: 'workflow',
            title: 'Error in Workflow',
            description: 'Failed at step 3',
            timestamp: '1 day ago',
            status: 'error',
          },
          {
            id: '5',
            type: 'agent',
            title: 'New Agent Created',
            description: 'Marketing Assistant Agent',
            timestamp: '2 days ago',
            status: 'success',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'workflow':
        return '⚙️';
      case 'agent':
        return '🤖';
      case 'execution':
        return '▶️';
      default:
        return '📋';
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'pending';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.name || 'User'}
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="action-button primary"
            onClick={() => navigate('/workflows/new')}
          >
            + New Workflow
          </button>
          <button
            className="action-button secondary"
            onClick={() => navigate('/agents/new')}
          >
            + New Agent
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <div className="stat-content">
            <p className="stat-label">Workflows</p>
            <p className="stat-value">{stats.workflowCount}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <p className="stat-label">Agents</p>
            <p className="stat-value">{stats.agentCount}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">▶️</div>
          <div className="stat-content">
            <p className="stat-label">Executions</p>
            <p className="stat-value">{stats.executionCount}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <p className="stat-label">Success Rate</p>
            <p className="stat-value">{stats.successRate}%</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-activity-section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
            <button
              className="view-all-button"
              onClick={() => navigate('/activity')}
            >
              View all →
            </button>
          </div>

          <div className="activity-list">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`activity-item status-${activity.status}`}
              >
                <div className="activity-icon">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <p className="activity-title">{activity.title}</p>
                  <p className="activity-description">
                    {activity.description}
                  </p>
                </div>
                <div className="activity-meta">
                  <span className={`activity-badge ${getStatusBadge(activity.status)}`}>
                    {activity.status.charAt(0).toUpperCase() +
                      activity.status.slice(1)}
                  </span>
                  <p className="activity-time">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-start-section">
          <h2 className="section-title">Quick Start</h2>
          <div className="quick-start-grid">
            <button
              className="quick-start-item"
              onClick={() => navigate('/workflows')}
            >
              <span className="quick-start-icon">⚙️</span>
              <span className="quick-start-text">View Workflows</span>
            </button>
            <button
              className="quick-start-item"
              onClick={() => navigate('/agents')}
            >
              <span className="quick-start-icon">🤖</span>
              <span className="quick-start-text">Manage Agents</span>
            </button>
            <button
              className="quick-start-item"
              onClick={() => navigate('/api-keys')}
            >
              <span className="quick-start-icon">🔑</span>
              <span className="quick-start-text">API Keys</span>
            </button>
            <button
              className="quick-start-item"
              onClick={() => navigate('/profile')}
            >
              <span className="quick-start-icon">👤</span>
              <span className="quick-start-text">Account Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
