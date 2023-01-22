import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:6001',
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          // Add localhost:8080, the Firestore emulator host:port when running locally, to the Chrome proxy bypass
          // So Cypress doesn't jack with it
          launchOptions.args.push('--proxy-bypass-list=<-loopback>,localhost:8080');
          /*
          // Options that provide marginal memory improvement in Chrome, but seem to break headed mode
          // Leaving them out for now as I don't fully understand them and the improvement is marginal
          launchOptions.args.push('--ChromeOSMemoryPressureHandling');
          launchOptions.args.push('--renderer-process-limit=1');
          launchOptions.args.push('--single-process');
          launchOptions.args.push('--disable-dev-shm-usage');
          */
        }
        return launchOptions;
      });
    },
  },
});
