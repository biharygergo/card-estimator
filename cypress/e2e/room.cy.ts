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

  afterEach(() => {
    cy.wait(1000);
  });

  it('shows onboarding tutorial', () => {
    cy.wait(1000);

    cy.contains('Greetings and Welcome to PlanningPoker.live 🎉').should('be.visible');
    cy.contains('Next').click();

    cy.contains('Define Your Topic').should('be.visible');
    cy.contains('Next').click({force: true});

    cy.contains('View Room Participants').should('be.visible');
    cy.contains('Next').click({force: true});

    cy.contains('Poker Card Deck').should('be.visible');
    cy.contains('Next').click({force: true});

    cy.contains('Manage the Room').should('be.visible');
    cy.contains('Next').click({force: true});

    cy.contains('Additional Configuration').should('be.visible');
    cy.contains('Next').click({force: true});

    cy.contains('Access Your Account & Settings').should('be.visible');
    cy.contains('Finish').click();

    cy.contains('Test User').should('be.visible');
  })

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
    cy.contains('Edit topic').click();
    cy.get('#topic-name').click().clear().type('Custom name');

    cy.contains('Save').click();

    cy.get('#room-options-button').click();
    cy.get('.topics-toggle').click();
    cy.get('.round-title').eq(1).should('contain.text', 'Custom name');
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

    cy.contains('13').should('be.visible');

    cy.get('#pass-option-card').should('be.visible');
  });

  it('can use minimized panel', () => {
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
    cy.get('#reactions-toggle').should('be.visible');
    cy.get('.reaction-buttons').should('be.visible');

    cy.get('#reactions-toggle').click();
    cy.get('.reaction-buttons').should('not.exist');
    cy.get('#reactions-toggle').click();

    cy.get('#reaction-button-1').click();
    cy.get('.reaction-wrapper').should('exist');
  });

  it('can open avatar editor', () => {
    cy.get('.member-options-button').click();
    cy.contains('My account').should('be.visible');

    cy.contains('Close').click();
  });

  it('can use async voting', () => {
    cy.get('#room-options-button').click();
    cy.get('.async-vote-checkbox').click();

    cy.get('body').click(10, 10);

    cy.contains('Async voting enabled').should('be.visible');

    cy.get('#async-next-round').should('be.disabled');

    cy.get('#async-previous-round').click();
    cy.contains('Custom name').should('be.visible');
    cy.get('#async-previous-round').click();
    cy.get('#async-previous-round').should('be.disabled');

    cy.get('#async-next-round').click();
    cy.contains('Custom name').should('be.visible');

    cy.get('#room-options-button').click();
    cy.get('.async-vote-checkbox').click();

    cy.get('body').click(10, 10);
    cy.contains('Topic of Round 3').should('be.visible');
  });

  it('can use anonymous voting', () => {
    cy.contains('Test User').should('be.visible');

    cy.get('#room-options-button').click();
    cy.get('.anonymous-vote-checkbox').click();

    cy.get('body').click(10, 10);

    cy.contains('Test User').should('not.exist');

    cy.get('#room-options-button').click();
    cy.get('.anonymous-vote-checkbox').click();
  });

  it('can override majority vote', () => {
    cy.get('#new-round-button').click();
    cy.contains('5').click();
    cy.contains('Reveal votes').click();

    cy.get('#override-majority-vote-button').click();

    cy.contains('Override majority vote').should('exist');
    cy.contains('Clear override').should('be.disabled');

    cy.get('#override-vote-button-3').click();
    cy.contains('Clear override').should('be.enabled');

    cy.contains('Close').click();

    cy.get('#majority-vote-chip').should('contain', '3');

    cy.get('#override-majority-vote-button').click();
    cy.contains('Clear override').click();
    cy.contains('Close').click();

    cy.get('#majority-vote-chip').should('contain', '5');
  });

  it('can toggle cards', () => {
    cy.get('.estimator-buttons').should('be.visible');
    cy.get('#minimize-toggle').click();
    cy.get('.estimator-buttons').should('not.exist');
  });

  it('can leave the room', () => {
    cy.get('#room-options-button').click();

    cy.contains('Leave room').click();

    cy.contains('Leave room').click();

    cy.contains('Create a new room').should('be.visible');
  });
});
