import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  deleteDoc,
  doc,
  docData,
  DocumentReference,
  Firestore,
  updateDoc,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, from, Observable, of, switchMap } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import {
  IssueApiFilter,
  IssuesSearchApiResult,
  JiraIntegration,
  JiraIssue,
  JiraResource,
  RichTopic,
} from '../types';
import { AuthService } from './auth.service';
import { ZoomApiService } from './zoom-api.service';

@Injectable({
  providedIn: 'root',
})
export class JiraService {
  constructor(
    private readonly firestore: Firestore,
    private readonly authService: AuthService,
    private readonly functions: Functions,
    private readonly http: HttpClient,
    private readonly zoomService: ZoomApiService,
    private readonly dialog: MatDialog,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {}

  async startJiraAuthFlow() {
    const API_URL = `${window.location.origin}/api`;

    const apiUrl = `${API_URL}/startJiraAuth`;
    let user = await this.authService.getUser();

    if (!user || user?.isAnonymous) {
      const dialogRef = this.dialog.open(
        ...signUpOrLoginDialogCreator({
          intent: user
            ? SignUpOrLoginIntent.LINK_ACCOUNT
            : SignUpOrLoginIntent.SIGN_IN,
          titleOverride:
            'Create a free Planning Poker account to integrate with Jira',
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

  getIntegration(): Observable<JiraIntegration | undefined> {
    return this.authService.user.pipe(
      switchMap(user => {
        if (!user || user.isAnonymous) {
          return of(undefined);
        }

        const jiraDoc = docData<JiraIntegration>(
          doc(
            this.firestore,
            `userDetails/${user.uid}/integrations/jira`
          ) as DocumentReference<JiraIntegration>
        );
        return jiraDoc;
      })
    );
  }

  updateJiraResourceList(resourceList: JiraResource[]) {
    return this.authService.user.pipe(
      switchMap(user => {
        if (!user || user.isAnonymous) {
          return of(undefined);
        }

        return from(
          updateDoc(
            doc(this.firestore, `userDetails/${user.uid}/integrations/jira`),
            { jiraResources: resourceList }
          )
        );
      })
    );
  }

  removeJiraIntegration() {
    return this.authService.user.pipe(
      switchMap(user => {
        if (!user || user.isAnonymous) {
          return of(undefined);
        }

        return from(
          deleteDoc(
            doc(this.firestore, `userDetails/${user.uid}/integrations/jira`)
          )
        );
      })
    );
  }

  getIssues(
    query?: string,
    filters?: IssueApiFilter[],
    after?: number
  ): Observable<IssuesSearchApiResult> {
    return from(
      httpsCallable(
        this.functions,
        'queryJiraIssues'
      )({ search: query, filters, after }).then(
        response => response.data as IssuesSearchApiResult
      )
    );
  }

  updateIssue(updateRequest?: {
    issueId: string;
    storyPoints: number;
  }): Observable<{ success: boolean }> {
    return from(
      httpsCallable(
        this.functions,
        'updateIssue'
      )({ updateRequest: { ...updateRequest, provider: 'jira' } }).then(
        response => response.data as { success: boolean }
      )
    );
  }
}
