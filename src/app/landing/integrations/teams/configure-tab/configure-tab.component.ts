import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { app, pages } from '@microsoft/teams-js';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';

@Component({
  selector: 'app-configure-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './configure-tab.component.html',
  styleUrls: ['./configure-tab.component.scss'],
})
export class ConfigureTabComponent implements OnInit {
  config: AppConfig = inject(APP_CONFIG);

  ngOnInit(): void {
    if (this.config.runningIn !== 'teams') {
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
      pages.config.registerOnSaveHandler((saveEvent) => {
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
