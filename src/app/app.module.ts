import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

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
  initializeAppCheck,
  provideAppCheck,
  ReCaptchaV3Provider,
} from '@angular/fire/app-check';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';

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
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    BrowserAnimationsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideAnalytics(() => getAnalytics()),
    provideAppCheck(() => {
      const provider = new ReCaptchaV3Provider(environment.recaptcha3SiteKey);
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
    ClipboardModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [ScreenTrackingService],
  bootstrap: [AppComponent],
})
export class AppModule {}
