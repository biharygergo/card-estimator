import { enableProdMode } from '@angular/core';
import * as Sentry from '@sentry/angular';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { bootstrapApplication } from '@angular/platform-browser';

import posthog from 'posthog-js'

posthog.init(
  environment.posthogKey,
  {
    api_host:environment.posthogHost,
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    defaults: '2025-11-30'
  }
)

if (environment.production) {
  enableProdMode();
}

function bootstrap() {
  if (
    environment.production &&
    typeof window !== 'undefined' &&
    !window.origin.includes('localhost')
  ) {
    Sentry.init({
      dsn: 'https://d71076cd76b04dc88d3ee08f8226af9b@o200611.ingest.sentry.io/6568379',
    });
  }

  bootstrapApplication(AppComponent, appConfig).catch(err =>
    console.error(err)
  );
}

if (document.readyState === 'complete') {
  bootstrap();
} else {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
