import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular-ivy';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import {
  initializeAnalytics,
  provideAnalytics,
  ScreenTrackingService,
} from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';

import { getFunctions } from 'firebase/functions';

import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { RoomLoadingComponent } from './room-loading/room-loading.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppConfigModule } from './app-config.module';
import {
  connectFunctionsEmulator,
  provideFunctions,
} from '@angular/fire/functions';
import {
  connectStorageEmulator,
  getStorage,
  provideStorage,
} from '@angular/fire/storage';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { GlobalErrorHandler } from './error-handler';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent, RoomLoadingComponent],
  imports: [
    AppRoutingModule,
    AppConfigModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDialogModule,
    BrowserAnimationsModule,
    HttpClientModule,
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
    }),
  ],
  providers: [
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
