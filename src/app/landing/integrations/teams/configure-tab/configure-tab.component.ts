import { Component, OnInit } from '@angular/core';

import { app, pages } from '@microsoft/teams-js';

@Component({
  selector: 'app-configure-tab',
  imports: [],
  templateUrl: './configure-tab.component.html',
  styleUrls: ['./configure-tab.component.scss'],
})
export class ConfigureTabComponent implements OnInit {
  ngOnInit(): void {
    if (typeof window === 'undefined') {
      // Client-side only code
      console.log('This code runs only on the client side');
      return;
    }
    // Initialize the Microsoft Teams SDK
    app.initialize().then(async () => {
      // const context = await app.getContext();

      /**
       * When the user clicks "Save", save the url for your configured tab.
       * This allows for the addition of query string parameters based on
       * the settings selected by the user.
       */
      pages.config.registerOnSaveHandler(saveEvent => {
        const baseUrl = `https://${window.location.hostname}:${window.location.port}`;
        pages.config
          .setConfig({
            suggestedDisplayName: 'Planning Poker',
            entityId: 'create_a_room',
            contentUrl: baseUrl + '/join?s=teams#follow-deep-link',
            websiteUrl: baseUrl + '/',
          })
          .then(() => {
            saveEvent.notifySuccess();
          });
      });

      /**
       * After verifying that the settings for your tab are correctly
       * filled in by the user you need to set the state of the dialog
       * to be valid.  This will enable the save button in the configuration
       * dialog.
       */
      pages.config.setValidityState(true);
    });
  }
}
