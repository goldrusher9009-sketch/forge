/**
 * Lazy-loaded route components for code splitting
 * Reduces initial bundle size by loading components on-demand
 */

import { lazy, Suspense, ReactNode } from 'react';
import { Spinner } from '../components/common/Spinner';

// Loading fallback component
const LazyLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <Spinner />
  </div>
);

// Lazy component wrapper with Suspense
export function withLazyLoading<P extends object>(
  Component: React.LazyExoticComponent<React.ComponentType<P>>
) {
  return (props: P) => (
    <Suspense fallback={<LazyLoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
}

// Authentication routes
export const LoginPage = lazy(() =>
  import('../pages/auth/Login').then(m => ({ default: m.Login }))
);

export const SignupPage = lazy(() =>
  import('../pages/auth/Signup').then(m => ({ default: m.Signup }))
);

export const EmailVerificationPage = lazy(() =>
  import('../pages/auth/EmailVerification').then(m => ({ default: m.EmailVerification }))
);

export const PasswordResetPage = lazy(() =>
  import('../pages/auth/PasswordReset').then(m => ({ default: m.PasswordReset }))
);

export const ResetPasswordPage = lazy(() =>
  import('../pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword }))
);

// Dashboard routes
export const DashboardPage = lazy(() =>
  import('../pages/dashboard/Dashboard').then(m => ({ default: m.Dashboard }))
);

export const WorkflowsPage = lazy(() =>
  import('../pages/workflows/Workflows').then(m => ({ default: m.Workflows }))
);

export const WorkflowDetailPage = lazy(() =>
  import('../pages/workflows/WorkflowDetail').then(m => ({ default: m.WorkflowDetail }))
);

export const CreateWorkflowPage = lazy(() =>
  import('../pages/workflows/CreateWorkflow').then(m => ({ default: m.CreateWorkflow }))
);

export const AgentsPage = lazy(() =>
  import('../pages/agents/Agents').then(m => ({ default: m.Agents }))
);

export const AgentDetailPage = lazy(() =>
  import('../pages/agents/AgentDetail').then(m => ({ default: m.AgentDetail }))
);

export const CreateAgentPage = lazy(() =>
  import('../pages/agents/CreateAgent').then(m => ({ default: m.CreateAgent }))
);

// Settings routes
export const APIKeysPage = lazy(() =>
  import('../pages/settings/APIKeys').then(m => ({ default: m.APIKeys }))
);

export const ProfilePage = lazy(() =>
  import('../pages/settings/Profile').then(m => ({ default: m.Profile }))
);

export const SettingsPage = lazy(() =>
  import('../pages/settings/Settings').then(m => ({ default: m.Settings }))
);

// Documentation routes
export const DocumentationPage = lazy(() =>
  import('../pages/documentation/Documentation').then(m => ({ default: m.Documentation }))
);

// Export wrapped components for use in router
export const LazyLoginPage = withLazyLoading(LoginPage);
export const LazySignupPage = withLazyLoading(SignupPage);
export const LazyEmailVerificationPage = withLazyLoading(EmailVerificationPage);
export const LazyPasswordResetPage = withLazyLoading(PasswordResetPage);
export const LazyResetPasswordPage = withLazyLoading(ResetPasswordPage);
export const LazyDashboardPage = withLazyLoading(DashboardPage);
export const LazyWorkflowsPage = withLazyLoading(WorkflowsPage);
export const LazyWorkflowDetailPage = withLazyLoading(WorkflowDetailPage);
export const LazyCreateWorkflowPage = withLazyLoading(CreateWorkflowPage);
export const LazyAgentsPage = withLazyLoading(AgentsPage);
export const LazyAgentDetailPage = withLazyLoading(AgentDetailPage);
export const LazyCreateAgentPage = withLazyLoading(CreateAgentPage);
export const LazyAPIKeysPage = withLazyLoading(APIKeysPage);
export const LazyProfilePage = withLazyLoading(ProfilePage);
export const LazySettingsPage = withLazyLoading(SettingsPage);
export const LazyDocumentationPage = withLazyLoading(DocumentationPage);
