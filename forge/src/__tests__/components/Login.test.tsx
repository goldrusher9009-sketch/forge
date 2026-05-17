import { render, screen, fireEvent, waitFor } from '@/test-utils';
import Login from '@/pages/Login';
import { mockAuthState } from '../utils/mock-data';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Login Component', () => {
  it('should render login form', () => {
    render(<Login />, { withAuth: false, withRouter: false });

    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should display validation errors on empty submission', async () => {
    render(<Login />, { withAuth: false, withRouter: false });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    render(<Login />, { withAuth: false, withRouter: false });

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should toggle password visibility', () => {
    render(<Login />, { withAuth: false, withRouter: false });

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/toggle password/i);

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');
  });

  it('should handle remember me checkbox', () => {
    render(<Login />, { withAuth: false, withRouter: false });

    const rememberCheckbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;

    expect(rememberCheckbox.checked).toBe(false);

    fireEvent.click(rememberCheckbox);

    expect(rememberCheckbox.checked).toBe(true);
  });

  it('should display signup and password reset links', () => {
    render(<Login />, { withAuth: false, withRouter: false });

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });
});
