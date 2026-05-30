export function setAppCheckCookie() {
  // cy.setCookie('APP_CHECK_CI_TOKEN', Cypress.env('APP_CHECK_TOKEN'));
  window.localStorage.setItem('cookiesAccepted', 'true');
}

export function clearFirebaseLocalStorage() {
  indexedDB.deleteDatabase('firebaseLocalStorageDb');
}

export function createNewRoom(userName: string, skipInvitationPopup: boolean = false) {
  clearFirebaseLocalStorage();
  cy.visit('/create');

  cy.get('#name').click().type(userName);
  cy.get('#create-room-button').click();
  cy.location('pathname', { timeout: 20000 }).should('include', '/room');
  cy.wait(1000);
  cy.url().as('roomUrl');
}

export function assertInvitationPopup() {
  cy.contains('Invite others to join').should('be.visible');
  cy.contains('Close').click();
}

function typeInActiveAuthField(
  selector: string,
  value: string,
  options?: Partial<Cypress.TypeOptions>
) {
  cy.get('.mat-mdc-tab-body-active')
    .find(selector)
    .scrollIntoView()
    .should('be.visible')
    .click()
    .clear()
    .type(value, options);
}

/** Fill email/password on the Sign in tab of the auth modal. */
export function fillSignInCredentials(
  email: string,
  password: string,
  options?: Partial<Cypress.TypeOptions>
) {
  if (email == null || password == null) {
    throw new Error(
      'fillSignInCredentials requires email and password strings. ' +
        'For premium-user tests, set PREMIUM_USER_PASSWORD in cypress.env.json ' +
        '(see cypress.env.example.json) or export CYPRESS_PREMIUM_USER_PASSWORD.'
    );
  }

  cy.get('#sign-up-modal').should('be.visible');
  typeInActiveAuthField('#email-input', email, options);
  typeInActiveAuthField('#password-input', password, options);
  cy.get('.mat-mdc-tab-body-active #create-account-button')
    .scrollIntoView()
    .should('be.visible')
    .click();
}

/** Fill email/password on the Register tab of the auth modal. */
export function fillRegisterCredentials(
  email: string,
  password: string,
  options?: Partial<Cypress.TypeOptions>
) {
  cy.get('#sign-up-modal').should('be.visible');
  typeInActiveAuthField('#email-input-register', email, options);
  typeInActiveAuthField('#password-input-register', password, options);
  cy.get('#create-account-button-register').scrollIntoView().should('be.visible').click();
}

/** Open the Sign in tab if the modal opened on Register. */
export function openSignInTab() {
  cy.get('#sign-up-modal').contains('Sign in').first().click();
}