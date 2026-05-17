import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import Alert from '../components/Alert';
import '../styles/Login.css';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
  } = useForm<LoginFormData>(
    { email: '', password: '', rememberMe: false },
    {
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
        // Call login hook with email and password
        await login(formData.email, formData.password, formData.rememberMe);
        
        // Store remember-me preference if checked
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedEmail', formData.email);
        }

        // Redirect to dashboard on success
        navigate('/dashboard');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Login failed. Please check your credentials.'
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, validateForm, login, navigate]
  );

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Forge</h1>
        <p className="login-subtitle">Sign in to your account</p>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} className="login-form">
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
            {touched.password && errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          <div className="form-group checkbox">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={loading}
            />
            <label htmlFor="rememberMe" className="checkbox-label">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/password-reset" className="footer-link">
            Forgot password?
          </Link>
        </div>

        <div className="login-divider">
          <span>Don't have an account?</span>
        </div>

        <Link to="/signup" className="signup-link">
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default Login;
