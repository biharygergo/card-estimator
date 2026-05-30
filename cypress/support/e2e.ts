// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Benign browser noise from Material menus / Shepherd during layout (see Chromium #809574).
Cypress.on('uncaught:exception', err => {
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
