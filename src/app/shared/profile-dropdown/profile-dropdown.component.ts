import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { avatarModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

@Component({
  selector: 'app-profile-dropdown',
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss'],
})
export class ProfileDropdownComponent implements OnInit {
  currentUser = this.auth.user;

  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {}

  async createAccount() {
    try {
      await this.auth.linkAccountWithGoogle();
    } catch (error) {
      this.snackBar.open(
        `Failed to link account with Google. The issue is: ${error.message}`,
        'OK',
        {
          duration: 3000,
        }
      );
    }
  }

  async unlinkAccount() {
    try {
      await this.auth.unlinkGoogleAccount();
    } catch (error) {
      this.snackBar.open(
        `Failed to unlink account with Google. The issue is: ${error.message}`,
        'OK',
        {
          duration: 3000,
        }
      );
    }
  }

  openAvatarSelector() {
    this.dialog.open(...avatarModalCreator());
    this.analytics.logClickedEditAvatar('profile_icon');
  }
}
