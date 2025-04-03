import { Inject, Injectable } from '@angular/core';
import {
  deleteDoc,
  doc,
  docData,
  DocumentReference,
  Firestore,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { ZoomApiService } from './zoom-api.service';
import { MatDialog } from '@angular/material/dialog';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { firstValueFrom, from, Observable, of, switchMap } from 'rxjs';
import { SlackIntegration } from '../types';

@Injectable({
  providedIn: 'root',
})
export class SlackService {
  constructor(
    private readonly firestore: Firestore,
    private readonly authService: AuthService,
    private readonly zoomService: ZoomApiService,
    private readonly dialog: MatDialog,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {}

  async startSlackAuthFlow() {
    const API_URL = `${window.location.origin}/api`;
    const apiUrl = `${API_URL}/slack/install`;
    let user = await this.authService.getUser();

    if (!user || user?.isAnonymous) {
      const dialogRef = this.dialog.open(
        ...signUpOrLoginDialogCreator({
          intent: user
            ? SignUpOrLoginIntent.LINK_ACCOUNT
            : SignUpOrLoginIntent.SIGN_IN,
          titleOverride:
            'Create a free Planning Poker account to integrate with Slack',
        })
      );

      await firstValueFrom(dialogRef.afterClosed());
      user = await this.authService.getUser();

      if (!user || user?.isAnonymous) {
        return;
      }
    }

    const idToken = await this.authService.refreshIdToken();
    this.authService.setSessionCookie(idToken);

    if (this.config.runningIn === 'zoom') {
      await this.zoomService.openUrl(
        apiUrl + `?token=${encodeURIComponent(idToken)}`,
        true
      );
      return;
    }

    if (this.config.runningIn === 'teams') {
      window.open(apiUrl + `?token=${encodeURIComponent(idToken)}`, '_blank');
      return;
    }

    window.open(apiUrl, '_blank');
  }

  getIntegration(): Observable<SlackIntegration | undefined> {
    return this.authService.user.pipe(
      switchMap(user => {
        if (!user || user.isAnonymous) {
          return of(undefined);
        }

        const slackIntegration = docData<SlackIntegration>(
          doc(
            this.firestore,
            `userDetails/${user.uid}/integrations/slack`
          ) as DocumentReference<SlackIntegration>
        );
        return slackIntegration;
      })
    );
  }

  removeSlackIntegration() {
    return this.authService.user.pipe(
      switchMap(user => {
        if (!user || user.isAnonymous) {
          return of(undefined);
        }

        return from(
          deleteDoc(
            doc(this.firestore, `userDetails/${user.uid}/integrations/slack`)
          )
        );
      })
    );
  }
}
