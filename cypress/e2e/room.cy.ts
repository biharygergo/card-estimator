import { createNewRoom, setAppCheckCookie } from '../support/utils';

describe('Inside the room', () => {
  beforeEach(() => {
    setAppCheckCookie();
    createNewRoom('Test User');
    cy.contains('Got it').click();
  });

  it('can cast votes', () => {
    cy.contains('Test User').should('be.visible');
    cy.contains('Waiting to vote').should('be.visible');

    cy.contains('0.5').click();
    cy.contains('Waiting to vote').should('not.exist');
    cy.contains('Votes').should('be.visible');

    cy.contains('Reveal Votes').click();
    cy.contains('Reveal Votes').should('be.disabled');

    cy.contains('New Round').click();

    // Banner appears
    cy.contains('Continue alone').click();

    cy.contains('Waiting to vote').should('be.visible');
  });

  it('can update the topic name', () => {
    cy.contains('Edit topic').click();
    cy.get('#topic-name').click().clear().type('Custom name');

    cy.contains('Save').click();

    cy.contains('Manage rounds').click();
    cy.get('.round-title').first().should('contain.text', 'Custom name');
  });

  it('can set notes', () => {
    cy.get('#notes-field').click().type('This is my note!').blur();
  });

  it('can use the timer', () => {
    cy.get('.time-left').should('contain.text', '30 second timer');
    cy.get('#start-button').click();
    cy.wait(1000);
    cy.get('#pause-button').click();
  });

  it('can set custom card sets', () => {
    cy.get('#room-options-button').click();
    cy.get('#card-sets-button').click();
    cy.get('.pass-option-checkbox').click();
    cy.contains('Fibonacci').click();

    cy.contains('13')
      .should('be.visible');

    cy.get('#pass-option-card').should('be.visible');
  });
});
