import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from '@angular/core';
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
} from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import {
  withInterceptorsFromDi,
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppConfigModule } from './app-config.module';
import { AppRoutingModule } from './app-routing.module';
import { provideCloudinaryLoader } from '@angular/common';
import {
  provideClientHydration,
  BrowserModule,
} from '@angular/platform-browser';
import { Router } from '@angular/router';
import { GlobalErrorHandler } from './error-handler';
import {
  ScreenTrackingService,
  provideAnalytics,
  initializeAnalytics,
} from '@angular/fire/analytics';
import { environment } from '../environments/environment';
import * as Sentry from '@sentry/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      AppRoutingModule,
      AppConfigModule,
      MatSnackBarModule,
      MatMenuModule,
      MatDialogModule,
      BrowserModule
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
    provideAppInitializer(() => {
      const initializerFn = ((() => () => {}) as any)(
        inject(Sentry.TraceService)
      );
      return initializerFn();
    }),
    provideClientHydration(),
    provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc'),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const app = initializeApp(environment.firebase);
      const firestore = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      } else {
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
    }),
  ],
};
