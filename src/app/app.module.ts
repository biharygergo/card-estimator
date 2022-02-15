import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireAnalyticsModule, ScreenTrackingService } from '@angular/fire/compat/analytics';
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

@NgModule({
  declarations: [
    AppComponent,
    CreateOrJoinRoomComponent,
    RoomComponent,
    LandingComponent,
    EstimateConverterPipe,
    AloneInRoomModalComponent,
    GithubBadgeComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireAnalyticsModule,
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
