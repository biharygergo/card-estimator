import { I18nPluralPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, switchMap, take, tap, withLatestFrom } from 'rxjs';
import { IssueIntegrationService } from 'src/app/services/issue-integration.service';
import { createModal } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { RichTopic } from 'src/app/types';

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
    I18nPluralPipe,
    NgTemplateOutlet,
    MatProgressSpinnerModule,
  ],
  templateUrl: './batch-import-topics-modal.component.html',
  styleUrl: './batch-import-topics-modal.component.scss',
})
export class BatchImportTopicsModalComponent implements OnInit {
  readonly searchedIssues = signal<RichTopic[]>([]);
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

  readonly visibleIssues = computed(() => {
    if (this.isOnlySelectedToggled()) {
      return {
        label: 'Selected issues',
        empty: 'None selected',
        issues: this.selectedIssues(),
      };
    }

    if (this.isSearchShown()) {
      return {
        label: 'Search results',
        empty: 'No results',
        issues: this.searchedIssues(),
      };
    }

    return {
      label: 'Recent issues',
      empty: 'No recent issues',
      issues: this.recentIssues(),
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
      (acc, curr) => ({ ...acc, [curr.id]: true }),
      {}
    )
  );

  readonly onSubmitSearch = new Subject<void>();
  readonly onClearSearch = new Subject<void>();

  constructor(
    private readonly issueIntegrationService: IssueIntegrationService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.onSubmitSearch
      .pipe(
        tap(() => this.isLoadingSearch.set(true)),
        switchMap(() => {
          const { query } = this.searchForm.value;
          return this.issueIntegrationService.searchIssues(query).pipe(take(1));
        }),
        tap(() => {
          this.isSearchShown.set(true);
          this.isLoadingSearch.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((issues) => {
        this.searchedIssues.set(issues);
      });

    this.onClearSearch
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isSearchShown.set(false);
        this.searchForm.reset();
        this.searchedIssues.set([]);
      });
  }

  toggleSelectedIssue(richTopic: RichTopic) {
    if (
      this.selectedIssues()
        .map((i) => i.id)
        .includes(richTopic.id)
    ) {
      this.selectedIssues.set(
        this.selectedIssues().filter((i) => i.id !== richTopic.id)
      );
    } else {
      this.selectedIssues.set([...this.selectedIssues(), richTopic]);
    }
  }
}

export const batchImportTopicsModalCreator = () =>
  createModal(BatchImportTopicsModalComponent, {});
