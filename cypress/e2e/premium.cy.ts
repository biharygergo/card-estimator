import {
  clearFirebaseLocalStorage,
  createNewRoom,
  setAppCheckCookie,
} from '../support/utils';

describe('Authentication', () => {
  const testEmail = `cypress-test-premium@example.com`;
  const testPassword = Cypress.env('PREMIUM_USER_PASSWORD');

  before(() => {
    clearFirebaseLocalStorage();
    setAppCheckCookie();
    cy.visit('/create');

    cy.get('#sign-in-button').click();

    // Account modal appears
    cy.get('#email-input').click().type(testEmail);
    cy.get('#password-input').click().type(testPassword);
    cy.get('#create-account-button').click();
    cy.wait(1000);
  });

  it('has unlimited members in an organization', () => {
    cy.get('#menu-button').click();
    cy.contains('My organization').click();

    cy.wait(1000);
    cy.contains('Preview this Premium Feature').should('not.exist');
  });

  it('can modify room permissions', () => {
    cy.visit('/create');

    cy.get('#create-room-button').click();
    cy.location('pathname').should('include', '/room');
    cy.wait(1000);

    cy.get('#room-options-button').click();
    cy.contains('Security and permissions').click();

    cy.contains('Create password').click().type('SomeRoomPassword');
    cy.contains('Save password').click();

    cy.wait(10000);
    cy.get('#password-protection-toggle').click();
    cy.contains('Password protection enabled').should('be.visible');

    cy.get('#mat-tab-label-0-1').click();
    cy.get('#CAN_VOTE-0').click();

    cy.get('#CAN_VOTE-0').should('have.class', 'mat-mdc-chip-selected');
  });

  it('saves card decks to the cloud', () => {
    cy.visit('/create');

    cy.get('#create-room-button').click();
    cy.location('pathname').should('include', '/room');
    cy.wait(1000);

    cy.get('#room-options-button').click();
    cy.get('#card-sets-button').click();


    cy.contains('Set a custom card deck').click();

    cy.get('#deck-name-input').type('My custom deck');
    cy.get('#deck-values-input').type('A,B,C,D,E');

    cy.get('#set-card-deck-button').click();

    cy.get('#room-options-button').click();
    cy.get('#card-sets-button').click();

    cy.contains('Saved card sets').click();

    cy.contains('My custom deck').should('be.visible');
  });
});
