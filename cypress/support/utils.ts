export function setAppCheckCookie() {
  cy.setCookie('APP_CHECK_CI_TOKEN', Cypress.env('APP_CHECK_TOKEN'));
}

export function clearFirebaseLocalStorage() {
  indexedDB.deleteDatabase('firebaseLocalStorageDb');
}

export function createNewRoom(userName: string) {
  clearFirebaseLocalStorage();
  cy.visit('/create');

  cy.get('#name').click().type('Test User');
  cy.get('#create-room-button').click();
  cy.location('pathname').should('include', '/room');
  return cy.url();
}
