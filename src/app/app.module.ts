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
  initializeAnalytics,
  provideAnalytics,
  ScreenTrackingService,
} from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { RoomLoadingComponent } from './room-loading/room-loading.component';
import { AppConfigModule } from './app-config.module';
import { MatDialogModule } from '@angular/material/dialog';
import { GlobalErrorHandler } from './error-handler';
import { HttpClientModule } from '@angular/common/http';
import { provideCloudinaryLoader } from '@angular/common';

@NgModule({
  declarations: [AppComponent, RoomLoadingComponent],
  imports: [
    AppRoutingModule,
    AppConfigModule,
    MatDialogModule,
    BrowserAnimationsModule,
    HttpClientModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => {
      const app = initializeApp(environment.firebase);
      return initializeAnalytics(app, {
        config: { cookie_flags: 'SameSite=None;Secure' },
      });
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
    provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc'),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
