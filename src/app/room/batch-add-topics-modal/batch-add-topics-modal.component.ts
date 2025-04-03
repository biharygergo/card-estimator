import { DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import {
  Observable,
  Subject,
  map,
  shareReplay,
  takeUntil,
  withLatestFrom,
} from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { ToastService } from 'src/app/services/toast.service';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { Room } from 'src/app/types';
import { AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';

interface BatchAddTopicsModalData {
  room: Room;
}

export const batchAddModalCreator = (
  data: BatchAddTopicsModalData
): ModalCreator<BatchAddTopicsModalComponent> => [
  BatchAddTopicsModalComponent,
  {
    id: 'batch-add-topics-modal',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
    data,
  },
];

function parseTopicsString(topicsInput: string) {
  return topicsInput.split(/\r?\n/).filter(topic => !!topic);
}

@Component({
  selector: 'app-batch-add-topics-modal',
  templateUrl: './batch-add-topics-modal.component.html',
  styleUrls: ['./batch-add-topics-modal.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    ReactiveFormsModule,
    MatError,
    MatDialogActions,
    MatButton,
    MatIcon,
    MatDialogClose,
    AsyncPipe,
  ],
})
export class BatchAddTopicsModalComponent implements OnInit, OnDestroy {
  topics = new FormControl<string>('', {
    nonNullable: true,
    validators: [
      Validators.required,
      control => {
        if (!control.value) return null;

        const topics = parseTopicsString(control.value);
        return topics.length > 20 ? { maxTopics: true } : null;
      },
    ],
  });
  parsedTopics$: Observable<string[] | undefined> =
    this.topics.valueChanges.pipe(
      map(topicsInput => {
        if (topicsInput === '') return undefined;
        return parseTopicsString(topicsInput).slice(0, 20);
      }),
      shareReplay(1)
    );

  onSubmit = new Subject<void>();
  onDestroy = new Subject<void>();

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly analyticsService: AnalyticsService,
    @Inject(MAT_DIALOG_DATA) private dialogData: BatchAddTopicsModalData,
    private readonly dialogRef: DialogRef,
    private readonly toastService: ToastService
  ) {}

  ngOnInit() {
    this.onSubmit
      .pipe(
        withLatestFrom(this.parsedTopics$),
        map(([, topics]) => {
          return topics;
        }),
        takeUntil(this.onDestroy)
      )
      .subscribe(async topics => {
        await this.estimatorService.batchAddRounds(
          this.dialogData.room,
          topics
        );
        this.toastService.showMessage(`${topics.length} rounds added!`);
        this.dialogRef.close();
      });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
