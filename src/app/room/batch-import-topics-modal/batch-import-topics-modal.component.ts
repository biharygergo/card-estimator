import { I18nPluralPipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  OnInit,
  QueryList,
  Signal,
  signal,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  catchError,
  map,
  Subject,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { IssueIntegrationService } from 'src/app/services/issue-integration.service';
import { createModal } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { RichTopic } from 'src/app/types';
import { RichTopicComponent } from '../rich-topic/rich-topic.component';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { RoomDataService } from '../room-data.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { DialogRef } from '@angular/cdk/dialog';
import { ToastService } from 'src/app/services/toast.service';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

interface FilterField {
  label: string;
  fieldName: string;
  comparator: 'is' | 'contains';
  values?: Array<{ label: string; fieldName: string }>;
  convertToNumber?: boolean;
  placeholder?: string;
  fixedValue?: any;
}
const LINEAR_FILTER_FIELDS: FilterField[] = [
  {
    label: 'ID',
    fieldName: 'number',
    comparator: 'is',
    convertToNumber: true,
    placeholder: 'Enter number only',
  },
  {
    label: 'Title',
    fieldName: 'title',
    comparator: 'contains',
  },
  {
    label: 'Description',
    fieldName: 'description',
    comparator: 'contains',
  },
  {
    label: 'Project',
    fieldName: 'project.name',
    comparator: 'contains',
  },
  {
    label: 'Team',
    fieldName: 'team.name',
    comparator: 'contains',
  },
  {
    label: 'Cycle',
    fieldName: 'cycle.name',
    comparator: 'contains',
  },
  {
    label: 'Status',
    fieldName: 'state.name',
    comparator: 'contains',
  },
  {
    label: 'Not estimated',
    fieldName: 'estimate',
    comparator: 'is',
    fixedValue: null,
  },
  {
    label: 'Label',
    fieldName: 'labels.name',
    comparator: 'contains',
  },
  {
    label: 'Only parent issues',
    fieldName: 'parent',
    comparator: 'is',
    fixedValue: null,
  }
];

const JIRA_FILTER_FIELDS: FilterField[] = [
  {
    label: 'Key',
    fieldName: 'issueKey',
    comparator: 'is',
  },
  {
    label: 'Title',
    fieldName: 'summary',
    comparator: 'contains',
  },
  {
    label: 'Description',
    fieldName: 'description',
    comparator: 'contains',
  },
  {
    label: 'Project',
    fieldName: 'project',
    comparator: 'is',
  },
  {
    label: 'Sprint',
    fieldName: 'sprint',
    comparator: 'is',
  },
  {
    label: 'Epic/parent',
    fieldName: 'parent',
    comparator: 'is',
  },
  {
    label: 'Status',
    fieldName: 'status',
    comparator: 'is',
  },
];

interface FilterChip {
  id: string;
  filter: FilterField;
  valueControl: FormControl<string>;
}
@Component({
  selector: 'app-batch-import-topics-modal',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule,
    MatChipsModule,
    MatExpansionModule,
    DragDropModule,
    I18nPluralPipe,
    MatProgressSpinnerModule,
    RichTopicComponent,
    MatMenuModule,
    MatIconModule,
  ],
  templateUrl: './batch-import-topics-modal.component.html',
  styleUrl: './batch-import-topics-modal.component.scss',
})
export class BatchImportTopicsModalComponent implements OnInit {
  readonly activeIntegration = toSignal(
    this.issueIntegrationService.getActiveIntegration()
  );

  readonly hasActiveIntegration = computed(
    () => this.activeIntegration() !== undefined
  );

  readonly searchedIssues = signal<RichTopic[]>([]);
  readonly nextPage = signal<number | string | undefined>(undefined);

  readonly recentIssues = toSignal(
    this.issueIntegrationService.getRecentIssues(),
    { initialValue: undefined }
  );
  readonly selectedIssues = signal<RichTopic[]>([]);

  private readonly isLoadingRecents = computed(() => {
    return this.recentIssues() === undefined;
  }, {});
  private readonly isLoadingSearch = signal<boolean>(false);

  readonly isLoading = computed(
    () => this.isLoadingRecents() || this.isLoadingSearch()
  );
  readonly isSearchShown = signal<boolean>(false);
  readonly isOnlySelectedToggled = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  readonly visibleIssues = computed(() => {
    if (this.isOnlySelectedToggled()) {
      return {
        label: 'Selected issues',
        subtitle: 'You can drag issues to adjust import order',
        empty: 'None selected',
        issues: this.selectedIssues(),
      };
    }

    if (this.isSearchShown()) {
      return {
        label: 'Search results',
        empty: 'No results',
        issues: this.searchedIssues(),
        showSelectAll: true,
      };
    }

    return {
      label: 'Recent issues',
      empty: 'No recent issues',
      issues: this.recentIssues(),
      showSelectAll: true,
    };
  });

  readonly searchForm = new FormGroup({
    query: new FormControl<string>('', { nonNullable: true }),
  });

  readonly issuesPlural = {
    '=0': 'No issues selected',
    '=1': '1 issue selected',
    other: '# issues selected',
  };

  readonly selectedIssueIdsMap = computed(() =>
    this.selectedIssues().reduce(
      (acc, curr) => ({ ...acc, [curr.key]: true }),
      {}
    )
  );

  readonly onSubmitSearch = new Subject<void>();
  readonly onLoadMore = new Subject<void>();
  readonly onClearSearch = new Subject<void>();
  readonly onSubmitImport = new Subject<void>();

  readonly issueFilters: Signal<FilterField[]> = computed(() => {
    if (this.activeIntegration() === undefined) {
      return [];
    }

    return this.activeIntegration().name === 'jira'
      ? JIRA_FILTER_FIELDS
      : LINEAR_FILTER_FIELDS;
  });
  readonly filterChips = signal<FilterChip[]>([]);
  @ViewChildren('filterChipInput') filterChipElements: QueryList<ElementRef>;

  constructor(
    private readonly issueIntegrationService: IssueIntegrationService,
    private readonly dialogRef: DialogRef,
    private readonly roomDataService: RoomDataService,
    private readonly estimatorService: EstimatorService,
    private readonly destroyRef: DestroyRef,
    private readonly toastService: ToastService,
    private readonly analytics: AnalyticsService
  ) {}

  ngOnInit() {
    this.onSubmitSearch
      .pipe(
        tap(() => this.isLoadingSearch.set(true)),
        switchMap(() => {
          return this.searchIssues();
        }),
        tap(() => {
          this.isSearchShown.set(true);
          this.isLoadingSearch.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
        catchError((e) => {
          this.isLoadingSearch.set(false);
          throw e;
        })
      )
      .subscribe((result) => {
        this.nextPage.set(result.nextPage);
        this.searchedIssues.set(result.issues);
      });

    this.onLoadMore
      .pipe(
        tap(() => this.isLoadingSearch.set(true)),
        switchMap(() => {
          return this.searchIssues(this.nextPage());
        }),
        tap(() => {
          this.isSearchShown.set(true);
          this.isLoadingSearch.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
        catchError((e) => {
          this.isLoadingSearch.set(false);
          throw e;
        })
      )
      .subscribe((result) => {
        this.nextPage.set(result.nextPage);
        this.searchedIssues.set([...this.searchedIssues(), ...result.issues]);
      });

    this.onClearSearch
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isSearchShown.set(false);
        this.searchedIssues.set([]);
        this.filterChips.set([]);
        this.nextPage.set(undefined);
      });

    this.onSubmitImport
      .pipe(
        tap(() => this.isSubmitting.set(true)),
        withLatestFrom(this.roomDataService.room$),
        switchMap(([, room]) => {
          this.analytics.logClickedImportBatchIssues();
          return this.estimatorService.batchImportTopics(
            room,
            this.selectedIssues()
          );
        }),
        tap(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.toastService.showMessage(
          'Issues imported - you can find them in the topics sidebar.'
        );
        this.dialogRef.close();
      });
  }

  toggleSelectedIssue(richTopic: RichTopic) {
    this.analytics.logClickedBatchImportIssue();
    if (
      this.selectedIssues()
        .map((i) => i.key)
        .includes(richTopic.key)
    ) {
      this.selectedIssues.set(
        this.selectedIssues().filter((i) => i.key !== richTopic.key)
      );
    } else {
      this.selectedIssues.set([...this.selectedIssues(), richTopic]);
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    const arrayToMove = [...this.selectedIssues()];
    moveItemInArray(arrayToMove, event.previousIndex, event.currentIndex);
    this.selectedIssues.set(arrayToMove);
  }

  startProviderAuth(provider: 'jira' | 'linear') {
    if (provider === 'jira') {
      this.analytics.logClickedStartJiraAuth();
    }

    if (provider === 'linear') {
      this.analytics.logClickedLinearAuth();
    }

    this.issueIntegrationService.startAuth(provider);
  }

  addFilterChip(filterField: FilterField) {
    this.filterChips.set([
      ...this.filterChips(),
      {
        id: Date.now().toString(),
        filter: filterField,
        valueControl: new FormControl<string>(''),
      },
    ]);
    setTimeout(() => {
      if (this.filterChipElements.last?.nativeElement) {
        this.filterChipElements.last.nativeElement.focus();
      }
    });
  }

  selectAll() {
    const allIssues = [
      ...this.selectedIssues(),
      ...this.visibleIssues().issues,
    ];

    this.selectedIssues.set([...new Set(allIssues)]);
  }

  private searchIssues(nextPage?: number | string) {
    const { query } = this.searchForm.value;
    const filters = this.filterChips().map((chip) => {
      const filterValue = chip.filter.convertToNumber
        ? Number(chip.valueControl.value)
        : chip.valueControl.value;

      if (
        chip.filter.convertToNumber &&
        chip.valueControl.value !== '' &&
        isNaN(filterValue as number)
      ) {
        throw new Error('Please enter a number only for ID');
      }

      return {
        fieldName: chip.filter.fieldName,
        value: chip.filter.fixedValue === undefined ? filterValue : chip.filter.fixedValue,
        comparator: chip.filter.comparator,
      };
    });
    return this.issueIntegrationService
      .searchIssues(query, filters, nextPage)
      .pipe(take(1));
  }
}

export const batchImportTopicsModalCreator = () =>
  createModal(BatchImportTopicsModalComponent, {});
