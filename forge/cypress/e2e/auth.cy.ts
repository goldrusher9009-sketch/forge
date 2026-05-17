describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Login Flow', () => {
    it('should display login form', () => {
      cy.contains('h2', 'Sign in to your account').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.contains('button', 'Sign in').should('be.visible');
    });

    it('should show validation errors on empty submit', () => {
      cy.contains('button', 'Sign in').click();
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should show invalid email error', () => {
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.contains('button', 'Sign in').click();
      cy.contains('Please enter a valid email').should('be.visible');
    });

    it('should enable submit button with valid input', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('Password123!');
      cy.contains('button', 'Sign in').should('not.be.disabled');
    });

    it('should toggle password visibility', () => {
      const passwordInput = cy.get('input[type="password"]');
      cy.get('button[aria-label*="toggle password"]').click();
      cy.get('input[type="text"]').should('exist');
    });

    it('should handle remember me checkbox', () => {
      cy.get('input[type="checkbox"]').click();
      cy.get('input[type="checkbox"]').should('be.checked');
    });

    it('should navigate to signup page', () => {
      cy.contains('a', "Don't have an account?").click();
      cy.url().should('include', '/signup');
    });

    it('should navigate to password reset page', () => {
      cy.contains('a', 'Forgot your password?').click();
      cy.url().should('include', '/password-reset');
    });
  });

  describe('Signup Flow', () => {
    beforeEach(() => {
      cy.visit('/signup');
    });

    it('should display signup form', () => {
      cy.contains('h2', 'Create your account').should('be.visible');
      cy.get('input[placeholder*="Full name"]').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.contains('button', 'Sign up').should('be.visible');
    });

    it('should show password strength meter', () => {
      cy.get('input[type="password"]').first().type('weak');
      cy.contains('Password strength').should('be.visible');
    });

    it('should validate strong password requirements', () => {
      cy.get('input[type="password"]').first().type('StrongPass123!');
      cy.contains('Password strength').should('have.class', 'strong');
    });

    it('should require password confirmation match', () => {
      cy.get('input[type="password"]').first().type('Password123!');
      cy.get('input[type="password"]').last().type('DifferentPass123!');
      cy.get('input[type="password"]').last().blur();
      cy.contains('Passwords must match').should('be.visible');
    });

    it('should require terms acceptance', () => {
      cy.get('input[type="email"]').type('new@example.com');
      cy.get('input[type="password"]').first().type('Password123!');
      cy.get('input[type="password"]').last().type('Password123!');
      cy.contains('button', 'Sign up').click();
      cy.contains('You must accept the terms').should('be.visible');
    });

    it('should accept all terms and allow signup', () => {
      cy.get('input[placeholder*="Full name"]').type('New User');
      cy.get('input[type="email"]').type('new@example.com');
      cy.get('input[type="password"]').first().type('Password123!');
      cy.get('input[type="password"]').last().type('Password123!');
      cy.get('input[type="checkbox"]').click();
      cy.contains('button', 'Sign up').should('not.be.disabled');
    });
  });

  describe('Email Verification Flow', () => {
    it('should display verification page after signup', () => {
      cy.visit('/verify-email');
      cy.contains('Verify your email').should('be.visible');
      cy.contains('We sent a verification link').should('be.visible');
    });

    it('should handle verification token in URL', () => {
      cy.visit('/verify-email?token=test-token-123');
      cy.contains('Verifying your email').should('be.visible');
    });

    it('should allow resending verification email', () => {
      cy.visit('/verify-email');
      cy.contains('button', 'Resend email').click();
      cy.contains('Verification email sent').should('be.visible');
    });
  });

  describe('Password Reset Flow', () => {
    it('should display password reset form', () => {
      cy.visit('/password-reset');
      cy.contains('h2', 'Reset your password').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
    });

    it('should submit email for password reset', () => {
      cy.visit('/password-reset');
      cy.get('input[type="email"]').type('test@example.com');
      cy.contains('button', 'Send reset link').click();
      cy.contains('Check your email').should('be.visible');
    });

    it('should handle reset token in URL', () => {
      cy.visit('/password-reset?token=reset-token-123');
      cy.contains('Create new password').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });
  });
});
