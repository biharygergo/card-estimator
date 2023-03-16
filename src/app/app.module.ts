import { BrowserModule } from '@angular/platform-browser';
import {
  NgModule,
  APP_INITIALIZER,
  ErrorHandler,
  InjectionToken,
  Optional,
} from '@angular/core';
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
import type { app } from 'firebase-admin';
export const FIREBASE_ADMIN = new InjectionToken<app.App>('firebase-admin');

import { getFunctions, httpsCallable } from 'firebase/functions';

import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { isRunningInZoom } from './utils';
import { initializeApp as originalInitializeApp } from 'firebase/app';
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
import { GlobalErrorHandler } from './error-handler';

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
    MatDialogModule,
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
    provideStorage(() => {
      const storage = getStorage();
      if (environment.useEmulators) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }
      return storage;
    }),
    provideRemoteConfig(() => getRemoteConfig()),
    provideFunctions(() => {
      const functions = getFunctions();
      if (environment.useEmulators) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),
    provideAppCheck(
      (injector) => {
        const admin = injector.get<app.App | null>(FIREBASE_ADMIN, null);
        if (admin) {
          const provider = new CustomProvider({
            getToken: () =>
              admin
                .appCheck()
                .createToken(environment.firebase.appId, {
                  ttlMillis: 604_800_000 /* 1 week */,
                })
                .then(({ token, ttlMillis: expireTimeMillis }) => ({
                  token,
                  expireTimeMillis,
                })),
          });
          return initializeAppCheck(undefined, {
            provider,
            isTokenAutoRefreshEnabled: false,
          });
        } else {
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
            (typeof window !== 'undefined' &&
              window.origin.includes('localhost'))
          ) {
            if (
              typeof window !== 'undefined' &&
              !window.origin.includes('4200')
            ) {
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
        }
      },
      [new Optional(), FIREBASE_ADMIN]
    ),
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
    {
      provide: APP_INITIALIZER,
      useFactory: () => loadAppConfig,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
