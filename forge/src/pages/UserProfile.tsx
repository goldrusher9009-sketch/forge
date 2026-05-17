import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import '../styles/UserProfile.css';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  mfaEnabled: boolean;
  createdAt: string;
  lastLogin?: string;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [mfaSetupStep, setMfaSetupStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm<{
    name: string;
    email: string;
  }>(
    { name: '', email: '' },
    async (data) => {
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const updated = await response.json();
          setProfile(updated);
          setEditMode(false);
          setAlert({ type: 'success', message: 'Profile updated successfully' });
        } else {
          setAlert({ type: 'error', message: 'Failed to update profile' });
        }
      } catch (err) {
        setAlert({ type: 'error', message: 'Error updating profile' });
      }
    }
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          values.name = data.name;
          values.email = data.email;
        }
      } catch (err) {
        setAlert({ type: 'error', message: 'Error loading profile' });
      }
    };
    fetchProfile();
  }, []);

  const handleEnableMFA = async () => {
    setMfaSetupStep('setup');
  };

  const handleVerifyMFA = async (code: string) => {
    try {
      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (response.ok) {
        if (profile) {
          setProfile({ ...profile, mfaEnabled: true });
        }
        setMfaSetupStep('idle');
        setAlert({ type: 'success', message: 'MFA enabled successfully' });
      } else {
        setAlert({ type: 'error', message: 'Invalid verification code' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Error enabling MFA' });
    }
  };

  const handleDisableMFA = async () => {
    try {
      const response = await fetch('/api/mfa/disable', { method: 'POST' });
      if (response.ok) {
        if (profile) {
          setProfile({ ...profile, mfaEnabled: false });
        }
        setAlert({ type: 'success', message: 'MFA disabled successfully' });
      } else {
        setAlert({ type: 'error', message: 'Failed to disable MFA' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Error disabling MFA' });
    }
  };

  if (!profile) return <Loading />;

  return (
    <div className="user-profile-page">
      <div className="page-header">
        <div>
          <h1>Profile Settings</h1>
          <p className="subtitle">Manage your account and security settings</p>
        </div>
      </div>

      <div className="profile-grid">
        <Card>
          <div className="card-header">
            <h2>Account Information</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
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
                label="Email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                error={errors.email}
              />
              <Button variant="primary" type="submit" className="full-width">
                Save Changes
              </Button>
            </form>
          ) : (
            <div className="card-body">
              <div className="detail-row">
                <span className="label">Name:</span>
                <span>{profile.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span>{profile.email}</span>
              </div>
              <div className="detail-row">
                <span className="label">Member Since:</span>
                <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
              {profile.lastLogin && (
                <div className="detail-row">
                  <span className="label">Last Login:</span>
                  <span>{new Date(profile.lastLogin).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header">
            <h2>Security</h2>
          </div>
          <div className="card-body">
            <div className="security-section">
              <div className="security-header">
                <h3>Two-Factor Authentication</h3>
                <span className={`status-badge ${profile.mfaEnabled ? 'status-active' : 'status-inactive'}`}>
                  {profile.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {profile.mfaEnabled ? (
                <div className="mfa-active">
                  <p>Your account is protected with two-factor authentication.</p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDisableMFA}
                  >
                    Disable MFA
                  </Button>
                </div>
              ) : (
                <div className="mfa-inactive">
                  <p>Enable two-factor authentication to protect your account with an authenticator app.</p>
                  {mfaSetupStep === 'idle' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnableMFA}
                    >
                      Enable MFA
                    </Button>
                  )}
                  {mfaSetupStep === 'setup' && (
                    <div className="mfa-setup">
                      <p>Scan this QR code with your authenticator app:</p>
                      <div className="qr-placeholder">[QR Code Here]</div>
                      <Input
                        label="Verification Code"
                        placeholder="000000"
                        maxLength="6"
                        onChange={(e) => {
                          if (e.target.value.length === 6) {
                            handleVerifyMFA(e.target.value);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="security-section">
              <h3>Password</h3>
              <p>Change your password regularly to keep your account secure.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {}} // Would navigate to password change page
              >
                Change Password
              </Button>
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

export default UserProfile;