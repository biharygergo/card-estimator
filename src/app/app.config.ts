import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from '@angular/core';
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
import { ScreenTrackingService } from './firebase/screen-tracking.service';
import * as Sentry from '@sentry/angular';
import { provideLottieOptions } from 'ngx-lottie';

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
    provideLottieOptions({
      player: () => import('lottie-web'),
    }),
  ],
};
