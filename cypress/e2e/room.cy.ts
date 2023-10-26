import { createNewRoom, setAppCheckCookie } from '../support/utils';

describe('Inside the room', () => {
  let roomUrl;
  before(() => {
    setAppCheckCookie();
    createNewRoom('Test User');
    cy.url().as('roomUrl');
    cy.get('@roomUrl').then((url) => {
      roomUrl = url;
    });
  });

  beforeEach(() => {
    cy.visit(roomUrl);
  });

  it('can cast votes', () => {
    cy.contains('Test User').should('be.visible');
    cy.get('.vote-waiting').should('be.visible');

    cy.contains('0.5').click();
    cy.get('.vote-waiting').should('not.exist');
    cy.contains('Votes').should('be.visible');

    cy.contains('Reveal votes').click();
    cy.contains('Votes revealed').should('be.disabled');

    cy.contains('New round').click();

    // Banner appears
    cy.contains('Continue alone').click();

    cy.get('.vote-waiting').should('be.visible');
  });

  it('can update the topic name', () => {
    // Banner appears
    cy.contains('Continue alone').click();

    cy.contains('Edit topic').click();
    cy.get('#topic-name').click().clear().type('Custom name');

    cy.contains('Save').click();

    cy.get('#room-options-button').click();
    cy.get('.topics-toggle').click();
    cy.get('.round-title').eq(1).should('contain.text', 'Custom name');
  });

  it('can set notes', () => {
    // Banner appears
    cy.contains('Continue alone').click();

    cy.get('#notes-field').click().type('This is my note!').blur();
  });

  it('can use the timer', () => {
    // Banner appears
    cy.contains('Continue alone').click();
    cy.get('.time-left').should('contain.text', '30 second timer');
    cy.get('#start-button').click();
    cy.wait(1000);
    cy.get('#pause-button').click();
  });

  it('can set custom card sets', () => {
    // Banner appears
    cy.contains('Continue alone').click();

    cy.get('#room-options-button').click();
    cy.get('#card-sets-button').click();
    cy.get('.pass-option-checkbox').click();
    cy.contains('Fibonacci').click();

    cy.contains('13').should('be.visible');

    cy.get('#pass-option-card').should('be.visible');
  });

  it('can use minimized panel', () => {
    // Banner appears
    cy.contains('Continue alone').click();

    cy.get('.mat-sidenav-content').scrollTo('bottom');
    cy.get('#minimize-panel-button').click();

    cy.get('#new-round-button').click();
    cy.contains('Topic of Round 3').should('be.visible');

    cy.get('#reveal-results-button').click();
    cy.get('#reveal-results-button').should('be.disabled');

    cy.get('#invite-button').click();
    cy.contains('Join link copied to clipboard').should('be.visible');

    cy.get('#room-options-button').click();
    cy.get('#topics-toggle').click();
    cy.get('.round-title').should('exist');

    cy.get('body').click(10, 10);

    cy.get('#expand-button').click();
    cy.contains('New round').should('be.visible');
  });

  it('can send reactions', () => {
    // Banner appears
    cy.contains('Continue alone').click();

    cy.get('#reactions-toggle').should('be.visible');
    cy.get('.reaction-buttons').should('be.visible');

    cy.get('#reactions-toggle').click();
    cy.get('.reaction-buttons').should('not.exist');
    cy.get('#reactions-toggle').click();

    cy.get('#reaction-button-1').click();
    cy.get('.reaction-wrapper').should('exist');
  });

  it('can open avatar editor', () => {
    // Banner appears
    cy.contains('Continue alone').click();

    cy.get('.member-options-button').click();
    cy.contains('My account').should('be.visible');
  })
});
