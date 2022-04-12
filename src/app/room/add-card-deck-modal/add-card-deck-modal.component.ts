import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { debounceTime } from 'rxjs';
import { EstimatorService } from 'src/app/services/estimator.service';
import { CardSetValue, isNumeric } from 'src/app/types';
import { cardDeckValidator, convertInputToCards } from './validator';

export type AddCardDeckModalData = {
  roomId: string;
};

@Component({
  selector: 'app-add-card-deck-modal',
  templateUrl: './add-card-deck-modal.component.html',
  styleUrls: ['./add-card-deck-modal.component.scss'],
})
export class AddCardDeckModalComponent implements OnInit {
  cardDeckForm = new FormGroup({
    cardDeckName: new FormControl('', [Validators.required]),
    cardDeckValues: new FormControl('', [
      Validators.required,
      cardDeckValidator(),
    ]),
  });

  cardPreview: string[] = new Array(6).fill(undefined);

  constructor(
    public dialogRef: MatDialogRef<AddCardDeckModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddCardDeckModalData,
    private estimatorService: EstimatorService
  ) {}

  ngOnInit(): void {
    this.cardDeckForm
      .get('cardDeckValues')
      .valueChanges.pipe(debounceTime(50))
      .subscribe((value) => {
        const cards = convertInputToCards(value);
        for (let i = 0; i < 6; i++) {
          this.cardPreview[i] = cards[i] ?? undefined;
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
          acc[index + 1] = curr;
        }
        return acc;
      }, {}),
      icon: 'groups',
      key: 'CUSTOM',
    };

    this.estimatorService
      .setRoomCustomCardSetValue(this.data.roomId, customDeck)
      .then(() => {
        this.dialogRef.close();
      });
  }
}
