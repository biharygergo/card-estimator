import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
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
import { CreateOrJoinRoomComponent } from './create-or-join-room/create-or-join-room.component';
import { RoomComponent } from './room/room.component';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';

import { ClipboardModule } from '@angular/cdk/clipboard';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LandingComponent } from './landing/landing.component';
import { EstimateConverterPipe } from './pipes/estimate-converter.pipe';
import { AloneInRoomModalComponent } from './room/alone-in-room-modal/alone-in-room-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { GithubBadgeComponent } from './room/github-badge/github-badge.component';
import { HeaderComponent } from './landing/header/header.component';
import { FeaturesComponent } from './landing/features/features.component';
import { FaqComponent } from './landing/faq/faq.component';
import { PageHeaderComponent } from './landing/components/page-header/page-header.component';
import { FaqRowComponent } from './landing/faq/faq-row/faq-row.component';
import { NotesFieldComponent } from './room/notes-field/notes-field.component';
import { AddCardDeckModalComponent } from './room/add-card-deck-modal/add-card-deck-modal.component';
import { TopicsSidebarComponent } from './room/topics-sidebar/topics-sidebar.component';
import { CardDeckComponent } from './room/card-deck/card-deck.component';
import { ProfileDropdownComponent } from './shared/profile-dropdown/profile-dropdown.component';
import { AvatarSelectorModalComponent } from './shared/avatar-selector-modal/avatar-selector-modal.component';
import { Router } from '@angular/router';
import { AppConfigModule } from './app-config.module';
import { PrivacyComponent } from './landing/privacy/privacy.component';
import { TermsComponent } from './landing/terms/terms.component';
import { ZoomComponent } from './landing/zoom/zoom.component';
import { isRunningInZoom } from './utils';
import { initializeApp as originalInitializeApp } from 'firebase/app';

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
  declarations: [
    AppComponent,
    CreateOrJoinRoomComponent,
    RoomComponent,
    LandingComponent,
    EstimateConverterPipe,
    AloneInRoomModalComponent,
    GithubBadgeComponent,
    HeaderComponent,
    FeaturesComponent,
    FaqComponent,
    PageHeaderComponent,
    FaqRowComponent,
    NotesFieldComponent,
    AddCardDeckModalComponent,
    TopicsSidebarComponent,
    CardDeckComponent,
    ProfileDropdownComponent,
    AvatarSelectorModalComponent,
    PrivacyComponent,
    TermsComponent,
    ZoomComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    BrowserAnimationsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
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

      if (!environment.production) {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      return initializeAppCheck(undefined, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });
    }),
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    MatSidenavModule,
    MatBadgeModule,
    ClipboardModule,
    FormsModule,
    ReactiveFormsModule,
    AppConfigModule,
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
