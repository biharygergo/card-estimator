import {
  clearFirebaseLocalStorage,
  setAppCheckCookie,
} from '../support/utils';

describe('Creating a room as a new user', () => {
  beforeEach(() => {
    clearFirebaseLocalStorage();
    setAppCheckCookie();
    cy.visit('/create');
  });

  it('opens the Create room page', () => {
    cy.location('pathname').should('eq', '/create');
  });

  it('can create a new room', () => {
    cy.get('#create-room-button').should('be.disabled');
    cy.get('#name').click().type('Test User');
    cy.get('#create-room-button').click();
    cy.location('pathname').should('include', '/room');
  });
});

describe('Creating a room as a returning user', () => {
  beforeEach(() => {
    setAppCheckCookie();
    cy.visit('/create');
  });

  it('opens the Create room page', () => {
    cy.location('pathname').should('eq', '/create');
  });

  it('can create a new room', () => {
    cy.get('#welcome-back').should('be.visible');
    cy.get('#create-room-button').should('be.enabled');
    cy.get('#create-room-button').click();
    cy.location('pathname').should('include', '/room');
  });
});
