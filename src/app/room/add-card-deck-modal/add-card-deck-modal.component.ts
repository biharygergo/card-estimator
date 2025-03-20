import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import {
  catchError,
  debounceTime,
  from,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { CardSetValue, isNumeric } from 'src/app/types';
import {
  cardDeckValidator,
  convertInputToCards,
  CARD_DECK_IDEAL_SIZE,
  MAX_CARD_DECK_SIZE,
} from './validator';
import {
  CardDeckService,
  UnauthorizedError,
} from 'src/app/services/card-deck.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { PaymentService } from 'src/app/services/payment.service';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { NgClass } from '@angular/common';
import { MatCard } from '@angular/material/card';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToastService } from 'src/app/services/toast.service';

export type AddCardDeckModalData = {
  roomId: string;
};

@Component({
    selector: 'app-add-card-deck-modal',
    templateUrl: './add-card-deck-modal.component.html',
    styleUrls: ['./add-card-deck-modal.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        MatError,
        MatCard,
        NgClass,
        MatDialogActions,
        MatButton,
        MatDialogClose,
        MatIcon,
        MatExpansionModule,
    ]
})
export class AddCardDeckModalComponent implements OnInit {
  cardDeckForm = new FormGroup({
    cardDeckName: new FormControl<string>('', [Validators.required]),
    cardDeckValues: new FormControl<string>('', [
      Validators.required,
      cardDeckValidator(),
    ]),
  });

  readonly numericCardValuesFormGroup = new FormGroup<{
    [cardLabel: string]: FormControl<number>;
  }>({}, [
    (
      control: AbstractControl<{ [cardLabel: string]: number }>
    ): ValidationErrors | null => {
      const cards = convertInputToCards(
        this.cardDeckForm.get('cardDeckValues').value
      );
      const values = cards.map((card) => control.value[card]);

      const isAnyDuplicated = new Set(values).size !== values.length;
      if (isAnyDuplicated) {
        return { duplicated: true };
      }

      const isAllLargerThanPrevious = values.every((value, index) => {
        if (index === 0) {
          return true;
        }
        return value > values[index - 1];
      });

      if (!isAllLargerThanPrevious) {
        return { notAscending: true };
      }

      return null;
    },
  ]);

  readonly isAllNumeric = toSignal(
    this.cardDeckForm.controls.cardDeckValues.valueChanges.pipe(
      map((formValue) => {
        return convertInputToCards(formValue).every((value) =>
          isNumeric(value)
        );
      })
    )
  );

  readonly cardLabels = toSignal(
    this.cardDeckForm.get('cardDeckValues').valueChanges.pipe(
      debounceTime(50),
      map((value) => convertInputToCards(value).slice(0, MAX_CARD_DECK_SIZE))
    ),
    { initialValue: [] }
  );

  cardPreview: string[] = new Array(MAX_CARD_DECK_SIZE).fill(undefined);

  readonly CARD_DECK_IDEAL_SIZE = CARD_DECK_IDEAL_SIZE;
  readonly MAX_CARD_DECK_SIZE = MAX_CARD_DECK_SIZE;

  constructor(
    public dialogRef: MatDialogRef<AddCardDeckModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddCardDeckModalData,
    private estimatorService: EstimatorService,
    private readonly cardDeckService: CardDeckService,
    private readonly dialog: MatDialog,
    public readonly permissionService: PermissionsService,
    public readonly paymentsService: PaymentService,
    private analytics: AnalyticsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cardDeckForm
      .get('cardDeckValues')
      .valueChanges.pipe(debounceTime(50))
      .subscribe((value) => {
        const cards = convertInputToCards(value);
        const isAllNumeric = cards.every((value) => isNumeric(value));

        Object.keys(this.numericCardValuesFormGroup.controls).forEach((key) =>
          this.numericCardValuesFormGroup.removeControl(key)
        );

        for (let i = 0; i < MAX_CARD_DECK_SIZE; i++) {
          const cardLabel = cards[i];
          this.cardPreview[i] = cardLabel ?? undefined;
          if (cardLabel) {
            this.numericCardValuesFormGroup.setControl(
              cardLabel,
              new FormControl<number>(isAllNumeric ? +cardLabel : i, [
                Validators.required,
              ])
            );
          }
        }
      });
  }

  onSaveClick() {
    const cards = convertInputToCards(
      this.cardDeckForm.get('cardDeckValues').value
    );

    const isAllNumeric = cards.every((value) => isNumeric(value));

    const customDeck: CardSetValue = {
      title: this.cardDeckForm.value['cardDeckName'],
      values: cards.reduce((acc, curr, index) => {
        if (isAllNumeric) {
          acc[+curr] = curr;
        } else {
          acc[this.numericCardValuesFormGroup.value[curr]] = curr;
        }
        return acc;
      }, {}),
      icon: 'groups',
      key: 'CUSTOM',
    };

    this.analytics.logClickedSaveCustomCards();
    return from(
      this.estimatorService.setRoomCustomCardSetValue(
        this.data.roomId,
        customDeck
      )
    )
      .pipe(
        switchMap(() => {
          return this.cardDeckService.saveCardDeck(customDeck).pipe(
            catchError((error) => {
              if (error instanceof UnauthorizedError) {
                // Nothing to do
                return of({});
              } else {
                return throwError(() => error);
              }
            })
          );
        })
      )
      .subscribe(() => this.dialogRef.close());
  }
}
