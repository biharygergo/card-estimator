import { Component, Inject, OnDestroy, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from 'src/app/services/auth.service';
import { LinkService } from 'src/app/services/link.service';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

export const EMBED_SSO_LINK_MODAL = 'embed-sso-link-modal';

export interface EmbedSsoLinkDialogData {
  /** When known from work-email lookup (integration sign-in) */
  ssoProviderId?: string;
  ssoOrganizationId?: string;
  ssoOrganizationName?: string;
}

export const embedSsoLinkDialogCreator = (
  data: EmbedSsoLinkDialogData
): ModalCreator<EmbedSsoLinkDialogComponent> => [
  EmbedSsoLinkDialogComponent,
  {
    id: EMBED_SSO_LINK_MODAL,
    width: '90%',
    maxWidth: '460px',
    panelClass: 'custom-dialog',
    data,
  },
];

@Component({
  selector: 'app-embed-sso-link-dialog',
  templateUrl: './embed-sso-link-dialog.component.html',
  styleUrls: ['./embed-sso-link-dialog.component.scss'],
  imports: [
    MatDialogContent,
    MatButton,
    MatIcon,
    MatProgressSpinner,
  ],
})
export class EmbedSsoLinkDialogComponent implements OnDestroy {
  readonly userCode = signal<string | null>(null);
  readonly state = signal<'loading' | 'polling' | 'success' | 'error'>('loading');
  readonly errorMessage = signal('');
  /** Soft hint shown alongside polling spinner when repeated unknown errors fire. */
  readonly pollingHint = signal('');

  private pairingId = '';
  private deviceSecret = '';
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private unknownPollErrors = 0;
  private static readonly UNKNOWN_POLL_HINT_THRESHOLD = 5;

  constructor(
    private readonly authService: AuthService,
    private readonly linkService: LinkService,
    public dialogRef: MatDialogRef<EmbedSsoLinkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmbedSsoLinkDialogData
  ) {
    void this.startFlow();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async startFlow(): Promise<void> {
    this.state.set('loading');
    this.errorMessage.set('');
    this.pollingHint.set('');
    this.unknownPollErrors = 0;
    try {
      const p = await this.authService.createSsoLinkPairing();
      this.pairingId = p.pairingId;
      this.deviceSecret = p.deviceSecret;
      this.userCode.set(p.userCode);

      console.info('[ssoLinkPairing] embedded created pairing', {
        pairingId: p.pairingId,
        userCode: p.userCode,
      });

      const params = new URLSearchParams({ pairingId: p.pairingId });
      if (this.data.ssoProviderId?.trim() && this.data.ssoOrganizationId?.trim()) {
        params.set('providerId', this.data.ssoProviderId.trim());
        params.set('organizationId', this.data.ssoOrganizationId.trim());
        if (this.data.ssoOrganizationName?.trim()) {
          params.set('orgName', this.data.ssoOrganizationName.trim());
        }
      }
      const url = `${window.location.origin}/integrations/embed-sso-link?${params.toString()}`;
      this.linkService.openUrl(url);

      this.state.set('polling');
      this.pollTimer = setInterval(() => void this.tryRedeem(), 2000);
    } catch (e: unknown) {
      console.error('[ssoLinkPairing] embedded startFlow failed', e);
      this.state.set('error');
      this.errorMessage.set(
        e instanceof Error ? e.message : 'Could not start SSO handoff'
      );
    }
  }

  private async tryRedeem(): Promise<void> {
    if (!this.pairingId || !this.deviceSecret) {
      return;
    }
    try {
      const { customToken } = await this.authService.redeemSsoLinkPairing(
        this.pairingId,
        this.deviceSecret
      );
      this.unknownPollErrors = 0;
      this.pollingHint.set('');
      this.stopPolling();
      this.state.set('success');
      console.info('[ssoLinkPairing] embedded redeemed', {
        pairingId: this.pairingId,
      });
      try {
        await this.authService.signInWithCustomTokenFromPairing(customToken);
      } catch (signInErr) {
        console.error(
          '[ssoLinkPairing] embedded signInWithCustomToken failed',
          signInErr
        );
        this.state.set('error');
        this.errorMessage.set(
          signInErr instanceof Error
            ? signInErr.message
            : 'Could not finish signing in.'
        );
        return;
      }
      setTimeout(() => this.dialogRef.close(true), 1200);
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      if (err.status === 404 || /not completed/i.test(err.message ?? '')) {
        return;
      }
      if (err.status === 410 || /expired/i.test(err.message ?? '')) {
        this.stopPolling();
        this.state.set('error');
        this.errorMessage.set('This session expired. Close and try again.');
        return;
      }
      if (err.status === 403) {
        this.stopPolling();
        this.state.set('error');
        this.errorMessage.set('Invalid session. Close and try again.');
        return;
      }
      this.unknownPollErrors += 1;
      console.error('[ssoLinkPairing] embedded unknown polling error', {
        pairingId: this.pairingId,
        attempt: this.unknownPollErrors,
        status: err.status,
        message: err.message,
      });
      if (
        this.unknownPollErrors >=
        EmbedSsoLinkDialogComponent.UNKNOWN_POLL_HINT_THRESHOLD
      ) {
        this.pollingHint.set('Connection check is failing — still retrying…');
      }
    }
  }

  retry(): void {
    this.stopPolling();
    void this.startFlow();
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
