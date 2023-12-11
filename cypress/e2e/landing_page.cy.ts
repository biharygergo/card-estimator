describe('Landing page', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/');
  });

  it('opens the landing page', () => {
    cy.get('h1')
      .should('contain.text', 'Real-Time Agile Estimation for Remote Scrum Teams');
  });

  it('can navigate to the /create page', () => {
    cy.contains('Start planning').click();
    cy.location('pathname').should('eq', '/create');
  });

  it('can go to the Features page', () => {
    cy.contains('Features').click();
    cy.location('pathname').should('eq', '/features');
  })

  it('can go to the Pricing page', () => {
    cy.contains('Pricing').click();
    cy.location('pathname').should('eq', '/pricing');
  })

  it('can go to the Zoom page', () => {
    cy.contains('Integrations').click();
    cy.contains('Zoom Meetings').click();
    cy.location('pathname').should('eq', '/zoom');
  })

  it('can go to the Webex page', () => {
    cy.contains('Integrations').click();
    cy.contains('Webex Meetings').click();
    cy.location('pathname').should('eq', '/webex');
  })
});
