import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { ReferralService } from '../../services/referral.service';
import { ReferralStats } from '../../types';
import { ToastService } from 'src/app/services/toast.service';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../sign-up-or-login-dialog/sign-up-or-login-dialog.component';

export const referralDialogCreator = (): ModalCreator<ReferralDialogComponent> => [
  ReferralDialogComponent,
  {
    id: 'referralDialog',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
  },
];

@Component({
  selector: 'app-referral-dialog',
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatIconButton,
    MatIcon,
    MatProgressSpinner,
    MatTooltip,
  ],
  templateUrl: './referral-dialog.component.html',
  styleUrl: './referral-dialog.component.scss',
})
export class ReferralDialogComponent implements OnInit {
  stats: ReferralStats & { referralCode: string } | null = null;
  isLoading = true;
  error: string | null = null;
  referralLink = '';
  user$: Observable<User | null>;

  constructor(
    private dialogRef: MatDialogRef<ReferralDialogComponent>,
    private referralService: ReferralService,
    private toastService: ToastService,
    public authService: AuthService,
    private dialog: MatDialog
  ) {
    this.user$ = this.authService.user;
  }

  async ngOnInit(): Promise<void> {
    // Check if user is authenticated and not anonymous
    const user = await this.authService.getUser();
    
    if (!user || user.isAnonymous) {
      this.isLoading = false;
      return;
    }

    this.loadReferralStats();
  }

  async loadReferralStats(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      this.stats = await this.referralService.getReferralStats();
      this.referralLink = `${environment.domain}?referral=${this.stats.referralCode}`;
    } catch (error) {
      console.error('Error loading referral stats:', error);
      this.error = 'Failed to load referral information. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  copyReferralLink(): void {
    if (!this.referralLink) return;

    navigator.clipboard.writeText(this.referralLink).then(
      () => {
        this.toastService.showMessage('Referral link copied to clipboard!');
      },
      err => {
        console.error('Could not copy text: ', err);
        this.toastService.showMessage('Failed to copy link', 3000, 'error');
      }
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  openCreateAccountModal(): void {
    this.dialog.open(
      ...signUpOrLoginDialogCreator({
        intent: SignUpOrLoginIntent.LINK_ACCOUNT,
      })
    );
  }
}
