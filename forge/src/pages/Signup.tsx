import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import Alert from '../components/Alert';
import '../styles/Signup.css';

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
  } = useForm<SignupFormData>(
    {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
    {
      fullName: (value) => {
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 100) return 'Name must be less than 100 characters';
        return '';
      },
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) {
          return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(value)) {
          return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(value)) {
          return 'Password must contain at least one number';
        }
        if (!/[!@#$%^&*]/.test(value)) {
          return 'Password must contain at least one special character (!@#$%^&*)';
        }
        return '';
      },
      confirmPassword: (value) => {
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) {
          return 'Passwords do not match';
        }
        return '';
      },
      termsAccepted: (value) => {
        if (!value) return 'You must accept the terms and conditions';
        return '';
      },
    }
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');

      if (!validateForm()) {
        return;
      }

      setLoading(true);
      try {
        // Call signup hook with email, password, and full name
        await signup(formData.email, formData.password, formData.fullName);

        // Redirect to email verification page
        navigate('/verify-email', {
          state: { email: formData.email },
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Signup failed. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, validateForm, signup, navigate]
  );

  const passwordStrength = useCallback((): {
    score: number;
    label: string;
    color: string;
  } => {
    const password = formData.password;
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score: 2, label: 'Fair', color: '#f97316' };
    if (score <= 4) return { score: 3, label: 'Good', color: '#eab308' };
    return { score: 4, label: 'Strong', color: '#22c55e' };
  }, [formData.password]);

  const strength = passwordStrength();

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Forge</h1>
        <p className="signup-subtitle">Create your account</p>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${
                touched.fullName && errors.fullName ? 'error' : ''
              }`}
              placeholder="John Doe"
              disabled={loading}
            />
            {touched.fullName && errors.fullName && (
              <span className="form-error">{errors.fullName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${
                touched.email && errors.email ? 'error' : ''
              }`}
              placeholder="you@example.com"
              disabled={loading}
            />
            {touched.email && errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${
                touched.password && errors.password ? 'error' : ''
              }`}
              placeholder="••••••••"
              disabled={loading}
            />
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
            {touched.password && errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${
                touched.confirmPassword && errors.confirmPassword ? 'error' : ''
              }`}
              placeholder="••••••••"
              disabled={loading}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="form-group checkbox">
            <input
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleChange}
              disabled={loading}
            />
            <label htmlFor="termsAccepted" className="checkbox-label">
              I agree to the{' '}
              <a href="#terms" className="terms-link">
                Terms and Conditions
              </a>
            </label>
          </div>
          {touched.termsAccepted && errors.termsAccepted && (
            <span className="form-error">{errors.termsAccepted}</span>
          )}

          <button
            type="submit"
            className="signup-button"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="signup-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="login-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
