import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular-ivy';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

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

  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
}

if (document.readyState === 'complete') {
  bootstrap();
} else {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
