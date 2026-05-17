import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import '../styles/EmailVerification.css';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage('Email verification failed. The link may have expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Error verifying email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="email-verification-page">
      <Card className="verification-card">
        {status === 'verifying' && (
          <div className="card-body">
            <Loading />
            <p className="verification-message">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="card-body">
            <div className="success-icon">✓</div>
            <h2>Email Verified</h2>
            <p>{message}</p>
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
              className="full-width"
            >
              Go to Login
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="card-body">
            <div className="error-icon">✕</div>
            <h2>Verification Failed</h2>
            <Alert type="error" message={message} />
            <Button
              variant="secondary"
              onClick={() => navigate('/login')}
              className="full-width"
            >
              Back to Login
            </Button>
            <Button
              variant="secondary"
              onClick={() => {}} // Would navigate to resend verification page
              className="full-width"
            >
              Resend Verification Email
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmailVerification;