import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { AppConfigModule } from '../app-config.module';
import { EstimateConverterPipe } from '../pipes/estimate-converter.pipe';
import { RoundResultsComponent } from '../room/round-results/round-results.component';
import { AnonymousUserBannerComponent } from './anonymous-user-banner/anonymous-user-banner.component';
import { AuthProgressDialogComponent } from './auth-progress-dialog/auth-progress-dialog.component';
import { AvatarSelectorModalComponent } from './avatar-selector-modal/avatar-selector-modal.component';
import { ResizeMonitorDirective } from './directives/resize-monitor.directive';
import { ProfileDropdownComponent } from './profile-dropdown/profile-dropdown.component';
import { SessionHistoryComponent } from './session-history/session-history.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { SupportedPhotoUrlPipe } from './supported-photo-url.pipe';
import { SignUpOrLoginDialogComponent } from './sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { RoomAuthenticationModalComponent } from './room-authentication-modal/room-authentication-modal.component';
import { OrganizationModalComponent } from './organization-modal/organization-modal.component';
import { FileUploadDragDropComponent } from './file-upload-drag-drop/file-upload-drag-drop.component';
import { DragDropDirective } from './directives/drag-drop.directive';

@NgModule({
  declarations: [
    AnonymousUserBannerComponent,
    SupportedPhotoUrlPipe,
    SessionHistoryComponent,
    ProfileDropdownComponent,
    StarRatingComponent,
    AuthProgressDialogComponent,
    AvatarSelectorModalComponent,
    ResizeMonitorDirective,
    RoundResultsComponent,
    EstimateConverterPipe,
    SignUpOrLoginDialogComponent,
    RoomAuthenticationModalComponent,
    OrganizationModalComponent,
    FileUploadDragDropComponent,
    DragDropDirective,
  ],
  imports: [
    CommonModule,
    RouterModule,
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
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatBadgeModule,
    MatChipsModule,
    ClipboardModule,
    FormsModule,
    ReactiveFormsModule,
    AppConfigModule,
  ],
  exports: [
    CommonModule,
    AnonymousUserBannerComponent,
    SupportedPhotoUrlPipe,
    SessionHistoryComponent,
    ProfileDropdownComponent,
    StarRatingComponent,
    AuthProgressDialogComponent,
    AvatarSelectorModalComponent,
    ResizeMonitorDirective,
    RoundResultsComponent,
    EstimateConverterPipe,
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
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatBadgeModule,
    MatChipsModule,
    ClipboardModule,
    FormsModule,
    ReactiveFormsModule,
    AppConfigModule,
  ],
})
export class SharedModule {}
