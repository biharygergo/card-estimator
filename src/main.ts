import {
  enableProdMode,
  ErrorHandler,
  APP_INITIALIZER,
  importProvidersFrom,
} from '@angular/core';
import * as Sentry from '@sentry/angular-ivy';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import {
  provideFunctions,
  getFunctions,
  connectFunctionsEmulator,
} from '@angular/fire/functions';
import {
  provideStorage,
  getStorage,
  connectStorageEmulator,
} from '@angular/fire/storage';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import {
  provideFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
  getFirestore,
} from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import {
  withInterceptorsFromDi,
  provideHttpClient,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppConfigModule } from './app/app-config.module';
import { AppRoutingModule } from './app/app-routing.module';
import { provideCloudinaryLoader } from '@angular/common';
import {
  provideClientHydration,
  BrowserModule,
  bootstrapApplication,
} from '@angular/platform-browser';
import { Router } from '@angular/router';
import { GlobalErrorHandler } from './app/error-handler';
import {
  ScreenTrackingService,
  provideAnalytics,
  initializeAnalytics,
} from '@angular/fire/analytics';

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

  bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom(
        AppRoutingModule,
        AppConfigModule,
        MatSnackBarModule,
        MatMenuModule,
        MatDialogModule,
        BrowserModule.withServerTransition({ appId: 'serverApp' }),
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => {
          let firestore;
          if (environment.useEmulators) {
            const app = initializeApp(environment.firebase);
            firestore = initializeFirestore(app, {
              experimentalAutoDetectLongPolling: true,
            });
            connectFirestoreEmulator(firestore, 'localhost', 8080);
          } else {
            firestore = getFirestore();
          }
          return firestore;
        }),
        provideAuth(() => {
          const auth = getAuth();
          if (environment.useEmulators) {
            connectAuthEmulator(auth, 'http://localhost:9099', {
              disableWarnings: true,
            });
          }
          return auth;
        }),
        provideAnalytics(() => {
          const app = initializeApp(environment.firebase);
          return initializeAnalytics(app, {
            config: { cookie_flags: 'SameSite=None;Secure' },
          });
        }),
        provideStorage(() => {
          const storage = getStorage();
          if (environment.useEmulators) {
            connectStorageEmulator(storage, 'localhost', 9199);
          }
          return storage;
        }),
        provideFunctions(() => {
          const functions = getFunctions();
          if (environment.useEmulators) {
            connectFunctionsEmulator(functions, 'localhost', 5001);
          }
          return functions;
        })
      ),
      ScreenTrackingService,
      {
        provide: ErrorHandler,
        useClass: GlobalErrorHandler,
      },
      {
        provide: Sentry.TraceService,
        deps: [Router],
      },
      {
        provide: APP_INITIALIZER,
        useFactory: () => () => {},
        deps: [Sentry.TraceService],
        multi: true,
      },
      provideClientHydration(),
      provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc'),
      provideAnimations(),
      provideHttpClient(withInterceptorsFromDi()),
    ],
  }).catch((err) => console.error(err));
}

if (document.readyState === 'complete') {
  bootstrap();
} else {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
