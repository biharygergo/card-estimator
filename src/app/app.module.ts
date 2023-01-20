import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular';
import Cookies from 'js-cookie';

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
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
} from '@angular/fire/analytics';
import {
  AppCheckToken,
  CustomProvider,
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaV3Provider,
} from '@angular/fire/app-check';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  provideRemoteConfig,
  getRemoteConfig,
} from '@angular/fire/remote-config';

import { getFunctions, httpsCallable } from 'firebase/functions';

import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { isRunningInZoom } from './utils';
import { initializeApp as originalInitializeApp } from 'firebase/app';
import { RoomLoadingComponent } from './room-loading/room-loading.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AppConfigModule } from './app-config.module';

let appCheckToken: AppCheckToken;
type FetchAppCheckTokenData = { token: string; expiresAt: number };

function fetchToken(): Promise<AppCheckToken> {
  originalInitializeApp(environment.firebase);
  const functions = getFunctions();
  const fetchAppCheckToken = httpsCallable<undefined, FetchAppCheckTokenData>(
    functions,
    'fetchAppCheckToken'
  );
  return fetchAppCheckToken().then((response) => {
    return {
      token: response.data.token,
      expireTimeMillis: response.data.expiresAt * 1000,
    };
  });
}

function loadAppConfig(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (isRunningInZoom()) {
      fetchToken()
        .then((token) => {
          appCheckToken = token;
          resolve(undefined);
        })
        .catch((e) => {
          console.error(e);
          resolve(undefined);
        });
    } else {
      resolve(undefined);
    }
  });
}
@NgModule({
  declarations: [AppComponent, RoomLoadingComponent],
  imports: [
    AppRoutingModule,
    AppConfigModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
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
    provideAnalytics(() => getAnalytics()),
    provideRemoteConfig(() => getRemoteConfig()),
    provideAppCheck(() => {
      let provider: ReCaptchaV3Provider | CustomProvider;
      if (isRunningInZoom()) {
        provider = new CustomProvider({
          getToken: () =>
            new Promise((resolve) => {
              window.setTimeout(() => {
                // Workaround for not being able to refresh the AppCheck token here...
                window.location.reload();
              }, appCheckToken.expireTimeMillis - Date.now());
              resolve(appCheckToken);
            }),
        });
      } else {
        provider = new ReCaptchaV3Provider(environment.recaptcha3SiteKey);
      }

      if (
        !environment.production ||
        (typeof window !== 'undefined' && window.origin.includes('localhost'))
      ) {
        if (typeof window !== 'undefined') {
          (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
            Cookies.get('APP_CHECK_CI_TOKEN');
        } else {
          (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }
      }
      return initializeAppCheck(undefined, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });
    }),
  ],
  providers: [
    ScreenTrackingService,
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
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
    {
      provide: APP_INITIALIZER,
      useFactory: () => loadAppConfig,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
