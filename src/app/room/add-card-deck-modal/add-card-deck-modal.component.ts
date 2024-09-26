import {
  Component,
  Inject,
  OnInit,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormArray,
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
import { AsyncPipe, NgClass } from '@angular/common';
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
  standalone: true,
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
    AsyncPipe,
    MatExpansionModule,
  ],
})
export class AddCardDeckModalComponent implements OnInit {
  cardDeckForm = new FormGroup({
    cardDeckName: new FormControl<string>('', [Validators.required]),
    cardDeckValues: new FormControl<string>('', [
      Validators.required,
      cardDeckValidator(),
    ]),
  });

  numericCardValues: WritableSignal<{
    [cardLabel: string]: FormControl<number>;
  }> = signal({});

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
        const newNumericValues: { [cardLabel: string]: FormControl<number> } =
          {};

        for (let i = 0; i < MAX_CARD_DECK_SIZE; i++) {
          const cardLabel = cards[i];
          this.cardPreview[i] = cardLabel ?? undefined;
          if (cardLabel) {
            newNumericValues[cardLabel] = new FormControl<number>(
              isAllNumeric ? +cardLabel : i,
              [Validators.required]
            );
          }
          
        }

        this.numericCardValues.set(newNumericValues);
      });
  }

  validateCustomNumericValues(): boolean {
    const numericValues = this.numericCardValues();
    const values = Object.values(numericValues);

    const isAnyInvalid = values.some((control) => control.invalid);
    if (isAnyInvalid) {
      this.toastService.showMessage('All numeric card fields are required.', 5000, 'error');
      return false;
    }
    const isAnyDuplicated = new Set(values.map((control) => control.value)).size !== values.length;
    if (isAnyDuplicated) {
      this.toastService.showMessage('Duplicated values are not allowed in numeric card values.', 5000, 'error');
      return false;
    }

    const isAllLargerThanPrevious = values.every((control, index) => {
      if (index === 0) {
        return true;
      }
      return control.value > values[index - 1].value;
    });

    if (!isAllLargerThanPrevious) {
      this.toastService.showMessage('Numeric card values must be in ascending order.', 5000, 'error');
      return false;
    }

    return true;
  }

  onSaveClick() {
    const cards = convertInputToCards(
      this.cardDeckForm.get('cardDeckValues').value
    );

    const isAllNumeric = cards.every((value) => isNumeric(value));
    if (!isAllNumeric) {
      const isValid = this.validateCustomNumericValues();
      if (!isValid) {
        return;
      }
    }

    const customDeck: CardSetValue = {
      title: this.cardDeckForm.value['cardDeckName'],
      values: cards.reduce((acc, curr, index) => {
        if (isAllNumeric) {
          acc[+curr] = curr;
        } else {
          acc[this.numericCardValues()[curr].value] = curr;
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
