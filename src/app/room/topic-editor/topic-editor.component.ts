import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  fromEvent,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { JiraService } from 'src/app/services/jira.service';
import { ToastService } from 'src/app/services/toast.service';
import { RichTopic } from 'src/app/types';
import * as Sentry from '@sentry/angular-ivy';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { LinearService } from 'src/app/services/linear.service';
import { AuthService } from 'src/app/services/auth.service';
import { batchAddModalCreator } from '../batch-add-topics-modal/batch-add-topics-modal.component';
import { RoomDataService } from '../room-data.service';
import { MatDialog } from '@angular/material/dialog';
import { PermissionsService } from 'src/app/services/permissions.service';
import { AsyncPipe } from '@angular/common';
import { MatDivider } from '@angular/material/divider';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { RichTopicComponent } from '../rich-topic/rich-topic.component';
import { MatOptgroup, MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatAutocompleteTrigger,
  MatAutocomplete,
} from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { IssueIntegrationService } from 'src/app/services/issue-integration.service';
import { batchImportTopicsModalCreator } from '../batch-import-topics-modal/batch-import-topics-modal.component';

export interface TopicEditorInputOutput {
  topic: string;
  richTopic?: RichTopic | null;
}

@Component({
  selector: 'app-topic-editor',
  templateUrl: './topic-editor.component.html',
  styleUrls: ['./topic-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    FormsModule,
    MatAutocompleteTrigger,
    ReactiveFormsModule,
    MatSuffix,
    MatProgressSpinner,
    MatTooltip,
    MatIconButton,
    MatIcon,
    MatAutocomplete,
    MatOptgroup,
    MatOption,
    RichTopicComponent,
    MatButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatDivider,
    AsyncPipe,
  ],
})
export class TopicEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() roomTopic: Observable<TopicEditorInputOutput>;

  @Output() topicUpdated = new EventEmitter<TopicEditorInputOutput>();
  @Output() canceled = new EventEmitter();

  @ViewChild('topicInput') topicInput: ElementRef;

  roundTopic = new FormControl<string | RichTopic>('', { nonNullable: true });
  isSearching: boolean = false;
  isFetchingRecents: boolean = false;

  selectedRichTopic: RichTopic | undefined | null;

  debouncedTopic$: Observable<string> = this.roundTopic.valueChanges.pipe(
    debounceTime(500),
    map((topic) => this.displayFn(topic))
  );

  startJiraAuth = new Subject<void>();
  startLinearAuth = new Subject<void>();

  selectedIssueIntegrationProvider$ = this.authService.getUserPreference().pipe(
    map((pref) => pref?.selectedIssueIntegrationProvider),
    shareReplay(1)
  );

  activeIntegration$ = this.issueIntegrationService.getActiveIntegration();
  connectedIntegrations$ =
    this.issueIntegrationService.getConnectedIntegrations();

  issuesFromIntegration$ = new BehaviorSubject<{
    recent: RichTopic[];
    search: RichTopic[];
  }>({ recent: [], search: [] });

  recentIssues$: Observable<RichTopic[]> = of([]).pipe(
    tap(() => {
      this.isFetchingRecents = true;
    }),
    switchMap(() => this.issueIntegrationService.getRecentIssues()),
    tap(() => (this.isFetchingRecents = false))
  );

  issuesFromQuery$: Observable<RichTopic[]> = this.debouncedTopic$.pipe(
    tap(() => {
      this.isSearching = true;
    }),
    switchMap((query) => {
      return this.issueIntegrationService.searchIssues(query);
    }),
    tap(() => {
      this.isSearching = false;
    })
  );

  destroy = new Subject<void>();
  menuOpen = signal(false);

  constructor(
    private readonly jiraService: JiraService,
    private readonly linearService: LinearService,
    private readonly toastService: ToastService,
    private readonly authService: AuthService,
    private readonly analyticsService: AnalyticsService,
    private readonly roomDataService: RoomDataService,
    private readonly dialog: MatDialog,
    public readonly permissionsService: PermissionsService,
    private readonly issueIntegrationService: IssueIntegrationService
  ) {}

  ngOnInit(): void {
    this.focusTopicInput();

    this.roomTopic
      .pipe(takeUntil(this.destroy))
      .subscribe(({ topic, richTopic }) => {
        this.roundTopic.setValue(topic);
        this.selectedRichTopic = richTopic;
      });

    this.issuesFromQuery$.pipe(takeUntil(this.destroy)).subscribe((issues) => {
      this.issuesFromIntegration$.next({
        search: issues,
        recent: this.issuesFromIntegration$.value.recent,
      });
    });

    this.recentIssues$.pipe(takeUntil(this.destroy)).subscribe((recents) => {
      this.issuesFromIntegration$.next({
        recent: recents,
        search: this.issuesFromIntegration$.value.search,
      });
    });

    this.startJiraAuth
      .pipe(
        withLatestFrom(this.connectedIntegrations$),
        takeUntil(this.destroy)
      )
      .subscribe(([, connectedIntegrations]) => {
        if (!connectedIntegrations.jira) {
          this.analyticsService.logClickedStartJiraAuth();
          this.jiraService.startJiraAuthFlow();
        } else {
          this.authService
            .updateUserPreference({
              selectedIssueIntegrationProvider: 'jira',
            })
            .subscribe();
        }
        this.focusTopicInput();
      });

    this.startLinearAuth
      .pipe(
        withLatestFrom(this.connectedIntegrations$),
        takeUntil(this.destroy)
      )
      .subscribe(([, connectedIntegrations]) => {
        if (!connectedIntegrations.linear) {
          this.analyticsService.logClickedLinearAuth();
          this.linearService.startLinearAuthFlow();
        } else {
          this.authService
            .updateUserPreference({
              selectedIssueIntegrationProvider: 'linear',
            })
            .subscribe();
        }
        this.focusTopicInput();
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      fromEvent(this.topicInput.nativeElement, 'keyup')
        .pipe(
          filter((e: KeyboardEvent) => e.key === 'Enter'),
          takeUntil(this.destroy)
        )
        .subscribe(() => this.topicBlur());
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  focusTopicInput() {
    setTimeout(() => this.topicInput.nativeElement.focus());
  }

  topicBlur() {
    this.topicUpdated.next({
      topic: this.displayFn(this.roundTopic.value),
      richTopic: this.selectedRichTopic,
    });
  }

  displayFn(issue: RichTopic | string) {
    if (typeof issue === 'string') {
      return issue;
    }
    return `${issue.key}: ${issue.summary}`;
  }

  issueSelected(issue: RichTopic) {
    console.log(issue);
    this.selectedRichTopic = {
      description: issue.description,
      summary: issue.summary,
      key: issue.key,
      url: issue.url,
      provider: issue.provider,
      assignee: issue.assignee,
      status: issue.status,
    };
    this.analyticsService.logSelectedJiraIssueFromDropdown();
  }

  openBatchAddModal() {
    this.roomDataService.room$.pipe(take(1)).subscribe((room) => {
      this.dialog.open(...batchAddModalCreator({ room }));
    });
  }

  openBatchImportModal() {
    this.analyticsService.logClickedBatchImportTopicsModal();
    this.dialog.open(...batchImportTopicsModalCreator());
  }
}
