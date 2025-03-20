import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { JiraService } from './jira.service';
import { LinearService } from './linear.service';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { RichTopic, IssueApiFilter, IssuesSearchApiResult } from '../types';
import { ToastService } from './toast.service';
import * as Sentry from '@sentry/angular';

interface IntegrationProvider {
  name: 'jira' | 'linear';
  service: {
    getIssues: (
      query?: string,
      filters?: IssueApiFilter[],
      after?: number | string
    ) => Observable<IssuesSearchApiResult>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class IssueIntegrationService {
  private readonly jiraIntegration$ = this.jiraService.getIntegration();
  private readonly linearIntegration$ = this.linearService.getIntegration();
  private readonly selectedIssueIntegrationProvider$ = this.authService
    .getUserPreference()
    .pipe(
      map((pref) => pref?.selectedIssueIntegrationProvider),
      shareReplay(1)
    );

  private readonly activeIntegration = new BehaviorSubject<
    IntegrationProvider | undefined | null
  >(null);

  private readonly connectedIntegrations = new BehaviorSubject<{
    jira: boolean;
    linear: boolean;
  } | null>(null);

  constructor(
    private readonly authService: AuthService,
    private readonly jiraService: JiraService,
    private readonly linearService: LinearService,
    private readonly toastService: ToastService
  ) {
    combineLatest([
      this.jiraIntegration$,
      this.linearIntegration$,
      this.selectedIssueIntegrationProvider$,
    ])
      .pipe(
        tap(([jiraIntegration, linearIntegration]) => {
          this.connectedIntegrations.next({
            jira: !!jiraIntegration,
            linear: !!linearIntegration,
          });
        }),
        map(
          ([
            jiraIntegration,
            linearIntegration,
            selectedIssueIntegrationProvider,
          ]) => {
            if (
              selectedIssueIntegrationProvider === 'linear' &&
              linearIntegration
            ) {
              return {
                name: 'linear',
                service: this.linearService,
              } satisfies IntegrationProvider;
            } else if (!!jiraIntegration) {
              // Default to Jira even if setAsActiveIntegration is not set on it (optional)
              return {
                name: 'jira',
                service: this.jiraService,
              } satisfies IntegrationProvider;
            } else {
              return undefined;
            }
          }
        )
      )
      .subscribe((integration) => this.activeIntegration.next(integration));
  }

  getConnectedIntegrations(): Observable<{ jira: boolean; linear: boolean }> {
    return this.connectedIntegrations.pipe(
      filter((integrations) => integrations !== null)
    );
  }

  getActiveIntegration(): Observable<IntegrationProvider | undefined> {
    return this.activeIntegration.pipe(
      filter((integration) => integration !== null)
    );
  }

  searchIssues(
    query: string,
    filters?: IssueApiFilter[],
    after?: number | string
  ): Observable<IssuesSearchApiResult> {
    return this.getActiveIntegration().pipe(
      switchMap((integration) => {
        if (!integration) {
          return of({ issues: [] });
        }

        if (!query && !filters) {
          return of({ issues: [] });
        }

        if (query.includes('Topic of Round ')) {
          return of({ issues: [] });
        }

        return integration.service
          .getIssues(query, filters, after);
      }),
      catchError((e) => this.handleError(e))
    );
  }

  getRecentIssues(): Observable<RichTopic[]> {
    return this.getActiveIntegration().pipe(
      switchMap((integration) => {
        if (!integration) {
          return of([]);
        }

        return integration.service
          .getIssues()
          .pipe(map((result) => result.issues));
      }),
      catchError((e) => this.handleError(e).pipe(map((r) => r.issues)))
    );
  }

  startAuth(provider: 'jira' | 'linear') {
    if (provider === 'jira') {
      return this.jiraService.startJiraAuthFlow();
    } else if (provider === 'linear') {
      return this.linearService.startLinearAuthFlow();
    }

    throw new Error('Unknown provider');
  }

  private handleError(e: any) {
    console.error(e);
    Sentry.captureException(e);
    this.toastService.showMessage(
      `Could not fetch issues from provider. Please try again or reconnect from the Integrations menu. ${e.message}`,
      10000,
      'error'
    );
    return of({ issues: [] });
  }
}
