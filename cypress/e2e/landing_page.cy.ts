describe('Landing page', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/');
  });

  it('opens the landing page', () => {
    cy.get('h1').should(
      'contain.text',
      'Real-Time Agile Estimation for Remote Scrum Teams'
    );
  });

  it('can navigate to the /create page', () => {
    cy.contains('Start planning').click();
    cy.location('pathname').should('eq', '/create');
  });

  it('can go to the Features page', () => {
    cy.contains('Features').click();
    cy.location('pathname').should('eq', '/features');
  });

  it('can go to the Pricing page', () => {
    cy.contains('Pricing').click();
    cy.location('pathname').should('eq', '/pricing');
  });

  it('can go to the Teams page', () => {
    cy.wait(500);
    cy.contains('Integrations').click();
    cy.get('#header-teams-link').click();
    cy.location('pathname').should('eq', '/integrations/teams');
  });

  it('can go to the Zoom page', () => {
    cy.wait(500);
    cy.contains('Integrations').click();
    cy.get('#header-zoom-link').click();
    cy.location('pathname').should('eq', '/integrations/zoom');
  });

  it('can go to the Webex page', () => {
    cy.wait(500);
    cy.contains('Integrations').click();
    cy.get('#header-webex-link').click();
    cy.location('pathname').should('eq', '/integrations/webex');
  });
});
