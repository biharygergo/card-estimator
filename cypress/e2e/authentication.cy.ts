import {
  assertInvitationPopup,
  clearFirebaseLocalStorage,
  createNewRoom,
  setAppCheckCookie,
} from '../support/utils';


describe('Authentication', () => {
  const testEmail = `test+${Date.now()}@company.com`;
  const testPassword = 'SuperSecure123';

  beforeEach(() => {
    clearFirebaseLocalStorage();
    setAppCheckCookie();
    cy.visit('/create');
  });

  it('can link an account with email', () => {
    createNewRoom('Test Bela');

    // Skip onboarding
    cy.contains('No thanks').click();
    
    assertInvitationPopup();

    cy.get('#menu-button').click();
    cy.get('#account-menu-item').click();

    cy.get('#create-account-button-banner').click();

    // Account modal appears
    cy.get('#email-input').click().type(testEmail, { delay: 1});
    cy.get('#password-input').click().type(testPassword, { delay: 1});
    cy.get('#create-account-button').click();
    cy.wait(1000);

    // Modal disappears
    cy.get('#sign-up-modal').should('not.exist');

    cy.get('#user-email').should('contain', testEmail);
  });

  it('can sign back in', () => {
    cy.get('#sign-in-button').click();

    // Account modal appears
    cy.get('#email-input').click().type(testEmail, { delay: 10});
    cy.get('#password-input').click().type(testPassword, { delay: 1});
    cy.get('#create-account-button').click();
    cy.wait(1000);

    cy.get('#email-input').should('not.exist');
    // Modal disappears
    cy.get('#sign-up-modal').should('not.exist');

    cy.get('#welcome-back').should('be.visible');
  });
});
