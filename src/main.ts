import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { BrowserTracing } from '@sentry/tracing';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

function bootstrap() {
  Sentry.init({
    dsn: 'https://d71076cd76b04dc88d3ee08f8226af9b@o200611.ingest.sentry.io/6568379',
    integrations: [
      new BrowserTracing({
        tracingOrigins: [
          'localhost',
          'https://planningpoker.live',
          'https://firestore.googleapis.com',
        ],
        routingInstrumentation: Sentry.routingInstrumentation,
      }),
    ],
    tracesSampleRate: 0.5,
  });
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
}

if (document.readyState === 'complete') {
  bootstrap();
} else {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
