import { I18nPluralPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, OnInit, signal } from '@angular/core';
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
import { map, Subject, switchMap, take, tap, withLatestFrom } from 'rxjs';
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
    NgTemplateOutlet,
    MatProgressSpinnerModule,
    RichTopicComponent,
  ],
  templateUrl: './batch-import-topics-modal.component.html',
  styleUrl: './batch-import-topics-modal.component.scss',
})
export class BatchImportTopicsModalComponent implements OnInit {
  readonly hasActiveIntegration = toSignal(
    this.issueIntegrationService
      .getActiveIntegration()
      .pipe(map((integration) => integration !== undefined))
  );

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
      (acc, curr) => ({ ...acc, [curr.key]: true }),
      {}
    )
  );

  readonly onSubmitSearch = new Subject<void>();
  readonly onClearSearch = new Subject<void>();
  readonly onSubmitImport = new Subject<void>();

  constructor(
    private readonly issueIntegrationService: IssueIntegrationService,
    private readonly dialogRef: DialogRef,
    private readonly roomDataService: RoomDataService,
    private readonly estimatorService: EstimatorService,
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

    this.onSubmitImport
      .pipe(
        tap(() => this.isSubmitting.set(true)),
        withLatestFrom(this.roomDataService.room$),
        switchMap(([, room]) => {
          return this.estimatorService.batchImportTopics(
            room,
            this.selectedIssues()
          );
        }),
        tap(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.dialogRef.close();
      });
  }

  toggleSelectedIssue(richTopic: RichTopic) {
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
}

export const batchImportTopicsModalCreator = () =>
  createModal(BatchImportTopicsModalComponent, {});
