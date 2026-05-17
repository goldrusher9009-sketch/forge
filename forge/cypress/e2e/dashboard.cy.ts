describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('Password123!');
    cy.contains('button', 'Sign in').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Dashboard Layout', () => {
    it('should display main dashboard content', () => {
      cy.contains('h1', 'Dashboard').should('be.visible');
      cy.contains('Welcome back').should('be.visible');
    });

    it('should display statistics cards', () => {
      cy.contains('Workflows').should('be.visible');
      cy.contains('Agents').should('be.visible');
      cy.contains('Executions').should('be.visible');
      cy.contains('Success Rate').should('be.visible');
    });

    it('should display recent activity section', () => {
      cy.contains('h2', 'Recent Activity').should('be.visible');
      cy.get('[data-testid="activity-item"]').should('have.length.greaterThan', 0);
    });

    it('should display quick start section', () => {
      cy.contains('h2', 'Quick Start').should('be.visible');
      cy.contains('Create Workflow').should('be.visible');
      cy.contains('Create Agent').should('be.visible');
    });
  });

  describe('Navigation', () => {
    it('should navigate to workflows page', () => {
      cy.contains('a', 'Workflows').click();
      cy.url().should('include', '/workflows');
    });

    it('should navigate to agents page', () => {
      cy.contains('a', 'Agents').click();
      cy.url().should('include', '/agents');
    });

    it('should navigate to API keys page', () => {
      cy.contains('a', 'API Keys').click();
      cy.url().should('include', '/api-keys');
    });

    it('should navigate to profile page', () => {
      cy.contains('a', 'Profile').click();
      cy.url().should('include', '/profile');
    });
  });

  describe('Quick Start Actions', () => {
    it('should navigate to create workflow', () => {
      cy.contains('button', 'Create Workflow').click();
      cy.url().should('include', '/workflows/new');
    });

    it('should navigate to create agent', () => {
      cy.contains('button', 'Create Agent').click();
      cy.url().should('include', '/agents/new');
    });

    it('should navigate to API keys', () => {
      cy.contains('button', 'Generate API Key').click();
      cy.url().should('include', '/api-keys');
    });

    it('should navigate to documentation', () => {
      cy.contains('a', 'Documentation').should('have.attr', 'href');
    });
  });

  describe('Activity Interactions', () => {
    it('should display activity status indicators', () => {
      cy.get('[data-testid="activity-status"]').each(($status) => {
        cy.wrap($status).should('have.class', 'success')
          .or.should('have.class', 'pending')
          .or.should('have.class', 'error');
      });
    });

    it('should display activity timestamps', () => {
      cy.get('[data-testid="activity-timestamp"]').should('be.visible');
    });

    it('should click activity item to view details', () => {
      cy.get('[data-testid="activity-item"]').first().click();
      cy.url().should('include', '/workflows/');
    });
  });

  describe('Responsive Design', () => {
    it('should display properly on mobile', () => {
      cy.viewport('iphone-x');
      cy.contains('h1', 'Dashboard').should('be.visible');
      cy.get('[data-testid="stat-card"]').should('be.visible');
    });

    it('should display properly on tablet', () => {
      cy.viewport('ipad-2');
      cy.contains('h1', 'Dashboard').should('be.visible');
      cy.get('[data-testid="stat-card"]').should('have.length', 4);
    });

    it('should display properly on desktop', () => {
      cy.viewport('macbook-15');
      cy.contains('h1', 'Dashboard').should('be.visible');
      cy.get('[data-testid="stat-card"]').should('have.length', 4);
    });
  });
});
