import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { useForm } from '../hooks/useForm';
import '../styles/PasswordReset.css';

type ResetStep = 'request' | 'verify' | 'reset' | 'success';

const PasswordReset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setStep('reset');
    }
  }, [searchParams]);

  const requestForm = useForm<{ email: string }>(
    { email: '' },
    async (data) => {
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          setEmail(data.email);
          setStep('verify');
          setAlert({ type: 'success', message: 'Reset email sent. Check your inbox.' });
        } else {
          setAlert({ type: 'error', message: 'Failed to send reset email' });
        }
      } catch (err) {
        setAlert({ type: 'error', message: 'Error sending reset email' });
      }
    }
  );

  const resetForm = useForm<{
    password: string;
    passwordConfirm: string;
  }>(
    { password: '', passwordConfirm: '' },
    async (data) => {
      if (data.password !== data.passwordConfirm) {
        setAlert({ type: 'error', message: 'Passwords do not match' });
        return;
      }

      try {
        const token = searchParams.get('token');
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            password: data.password,
          }),
        });
        if (response.ok) {
          setStep('success');
          setAlert({ type: 'success', message: 'Password reset successfully' });
        } else {
          setAlert({ type: 'error', message: 'Failed to reset password' });
        }
      } catch (err) {
        setAlert({ type: 'error', message: 'Error resetting password' });
      }
    }
  );

  return (
    <div className="password-reset-page">
      <Card className="reset-card">
        {step === 'request' && (
          <form onSubmit={requestForm.handleSubmit} className="card-body">
            <h2>Forgot Password?</h2>
            <p className="subtitle">Enter your email address and we'll send you a link to reset your password.</p>
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={requestForm.values.email}
              onChange={requestForm.handleChange}
              error={requestForm.errors.email}
            />
            <Button variant="primary" type="submit" className="full-width">
              Send Reset Email
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/login')}
              className="full-width"
            >
              Back to Login
            </Button>
          </form>
        )}

        {step === 'verify' && (
          <div className="card-body">
            <h2>Check Your Email</h2>
            <p className="subtitle">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <div className="verify-steps">
              <ol>
                <li>Open the email from us</li>
                <li>Click the reset password link</li>
                <li>Enter your new password</li>
              </ol>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/login')}
              className="full-width"
            >
              Back to Login
            </Button>
            <Button
              variant="secondary"
              onClick={() => setStep('request')}
              className="full-width"
            >
              Try Another Email
            </Button>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={resetForm.handleSubmit} className="card-body">
            <h2>Reset Your Password</h2>
            <p className="subtitle">Enter your new password below.</p>
            <Input
              label="New Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={resetForm.values.password}
              onChange={resetForm.handleChange}
              error={resetForm.errors.password}
            />
            <Input
              label="Confirm Password"
              name="passwordConfirm"
              type="password"
              placeholder="••••••••"
              value={resetForm.values.passwordConfirm}
              onChange={resetForm.handleChange}
              error={resetForm.errors.passwordConfirm}
            />
            <Button variant="primary" type="submit" className="full-width">
              Reset Password
            </Button>
          </form>
        )}

        {step === 'success' && (
          <div className="card-body">
            <div className="success-icon">✓</div>
            <h2>Password Reset Successful</h2>
            <p className="subtitle">Your password has been reset. You can now log in with your new password.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
              className="full-width"
            >
              Go to Login
            </Button>
          </div>
        )}

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}
      </Card>
    </div>
  );
};

export default PasswordReset;