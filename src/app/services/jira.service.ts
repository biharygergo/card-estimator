import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  deleteDoc,
  doc,
  DocumentReference,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '../firebase/firebase';
import { docData } from '../firebase/firestore-rx';
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
    private readonly authService: AuthService,
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
            firestore,
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
            doc(firestore, `userDetails/${user.uid}/integrations/jira`),
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
            doc(firestore, `userDetails/${user.uid}/integrations/jira`)
          )
        );
      })
    );
  }

  getIssues(
    query?: string,
    filters?: IssueApiFilter[],
    nextPageToken?: string,
    sortBy?: { field: string; direction: 'asc' | 'desc' }
  ): Observable<IssuesSearchApiResult> {
    return from(
      httpsCallable(
        functions,
        'queryJiraIssues'
      )({ search: query, filters, nextPageToken, sortBy }).then(
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
        functions,
        'updateIssue'
      )({ updateRequest: { ...updateRequest, provider: 'jira' } }).then(
        response => response.data as { success: boolean }
      )
    );
  }
}
