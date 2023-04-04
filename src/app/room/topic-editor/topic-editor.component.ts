import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { JiraService } from 'src/app/services/jira.service';
import { ToastService } from 'src/app/services/toast.service';
import { JiraIssue, RichTopic } from 'src/app/types';
import * as Sentry from '@sentry/angular';
import { AnalyticsService } from 'src/app/services/analytics.service';

export interface TopicEditorInputOutput {
  topic: string;
  richTopic?: RichTopic | null;
}

@Component({
  selector: 'app-topic-editor',
  templateUrl: './topic-editor.component.html',
  styleUrls: ['./topic-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TopicEditorComponent implements OnInit, OnDestroy {
  @Input() roomTopic: Observable<TopicEditorInputOutput>;

  @Output() topicUpdated = new EventEmitter<TopicEditorInputOutput>();
  @Output() canceled = new EventEmitter();

  @ViewChild('topicInput') topicInput: ElementRef;

  roundTopic = new FormControl<string | JiraIssue>('', { nonNullable: true });
  isSearching: boolean = false;
  isFetchingRecents: boolean = false;

  selectedRichTopic: RichTopic | undefined | null;

  debouncedTopic$: Observable<string> = this.roundTopic.valueChanges.pipe(
    debounceTime(300),
    map((topic) => this.displayFn(topic))
  );

  startJiraAuth = new Subject<void>();

  jiraIntegration$ = this.jiraService.getIntegration();
  jiraIssues$ = new BehaviorSubject<{
    recent: JiraIssue[];
    search: JiraIssue[];
  }>({ recent: [], search: [] });

  recentJiraIssues$: Observable<JiraIssue[]> = this.jiraIntegration$.pipe(
    switchMap((integration) => {
      if (!integration) {
        return of([]);
      }

      this.isFetchingRecents = true;
      return this.jiraService.getIssues().pipe(
        tap(() => {
          this.isFetchingRecents = false;
        }),
        catchError((e) => {
          this.showJiraError(e);
          return of([]);
        })
      );
    })
  );

  jiraIssuesFromQuery$: Observable<JiraIssue[]> = combineLatest([
    this.jiraIntegration$,
    this.debouncedTopic$,
  ]).pipe(
    switchMap(([jiraIntegration, query]) => {
      if (!jiraIntegration) {
        return of([]);
      }

      if (!query) {
        return of([]);
      }

      if (query.includes('Topic of Round ')) {
        return of([]);
      }

      this.isSearching = true;
      return this.jiraService.getIssues(query).pipe(
        catchError((error) => {
          this.showJiraError(error);
          return of([]);
        })
      );
    }),
    tap(() => {
      this.isSearching = false;
    })
  );
  destroy = new Subject<void>();

  constructor(
    private readonly jiraService: JiraService,
    private readonly toastService: ToastService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  ngOnInit(): void {
    this.roomTopic
      .pipe(takeUntil(this.destroy))
      .subscribe(({ topic, richTopic }) => {
        this.roundTopic.setValue(topic);
        this.selectedRichTopic = richTopic;
      });

    this.jiraIssuesFromQuery$
      .pipe(takeUntil(this.destroy))
      .subscribe((issues) => {
        this.jiraIssues$.next({
          search: issues,
          recent: this.jiraIssues$.value.recent,
        });
      });

    this.recentJiraIssues$
      .pipe(takeUntil(this.destroy))
      .subscribe((recents) => {
        this.jiraIssues$.next({
          recent: recents,
          search: this.jiraIssues$.value.search,
        });
      });

    this.startJiraAuth.pipe(takeUntil(this.destroy)).subscribe((issues) => {
      this.analyticsService.logClickedStartJiraAuth();
      this.jiraService.startJiraAuthFlow();
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  topicBlur() {
    this.topicUpdated.next({
      topic: this.displayFn(this.roundTopic.value),
      richTopic: this.selectedRichTopic,
    });
  }

  displayFn(issue: JiraIssue | string) {
    if (typeof issue === 'string') {
      return issue;
    }
    return `${issue.key}: ${issue.summary}`;
  }

  issueSelected(issue: JiraIssue) {
    this.selectedRichTopic = {
      description: issue.description,
      summary: issue.summary,
      key: issue.key,
      url: issue.url,
      provider: 'jira',
      assignee: issue.assignee,
      status: issue.status,
    };
    this.analyticsService.logSelectedJiraIssueFromDropdown();
  }

  showJiraError(e: any) {
    console.error(e);
    Sentry.captureException(e);
    this.toastService.showMessage(
      `Could not fetch issues from Jira. Please try again or reconnect from the Integrations menu. ${e.message}`,
      10000,
      'error'
    );
  }
}
