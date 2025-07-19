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
