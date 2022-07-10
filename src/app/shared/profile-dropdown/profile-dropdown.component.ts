import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile-dropdown',
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss'],
})
export class ProfileDropdownComponent implements OnInit {
  currentUser = this.auth.user;

  constructor(private auth: AuthService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.auth.user.subscribe((user) => {
      console.log(user);
    });
  }

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
}
