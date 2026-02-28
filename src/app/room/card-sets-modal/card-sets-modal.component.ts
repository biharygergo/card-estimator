import { Component, Inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatDivider } from '@angular/material/divider';
import { NgClass } from '@angular/common';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { CardDeckService } from 'src/app/services/card-deck.service';
import { ConfirmDialogService } from 'src/app/shared/confirm-dialog/confirm-dialog.service';
import { ToastService } from 'src/app/services/toast.service';
import {
  CardSetValue,
  CustomCardSet,
  Room,
  SavedCardSetValue,
} from 'src/app/types';
import { getSortedCardSetValues } from 'src/app/utils';
import { AddCardDeckModalComponent } from '../add-card-deck-modal/add-card-deck-modal.component';

export interface CardSetsModalData {
  room: Room;
  estimationCardSets: CardSetValue[];
  selectedEstimationCardSetValue: CardSetValue;
  savedCardSets: SavedCardSetValue[];
}

const CARD_SETS_MODAL = 'card-sets';
const ADD_CARD_DECK_MODAL = 'add-card-deck';

export const cardSetsModalCreator = (
  data: CardSetsModalData
): ModalCreator<CardSetsModalComponent> => [
  CardSetsModalComponent,
  {
    id: CARD_SETS_MODAL,
    width: '90%',
    maxWidth: '480px',
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
    data,
  },
];

@Component({
  selector: 'card-sets-modal',
  templateUrl: './card-sets-modal.component.html',
  styleUrls: ['./card-sets-modal.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIcon,
    MatButton,
    MatIconButton,
    MatSlideToggle,
    MatDivider,
    NgClass,
  ],
})
export class CardSetsModalComponent {
  room: Room;
  estimationCardSets: CardSetValue[];
  selectedKey: string;
  savedCardSets = signal<SavedCardSetValue[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CardSetsModalData,
    private readonly dialogRef: MatDialogRef<CardSetsModalComponent>,
    private readonly dialog: MatDialog,
    private readonly analytics: AnalyticsService,
    private readonly estimatorService: EstimatorService,
    private readonly cardDeckService: CardDeckService,
    private readonly confirmService: ConfirmDialogService,
    private readonly toastService: ToastService
  ) {
    this.room = data.room;
    this.estimationCardSets = data.estimationCardSets;
    this.selectedKey = data.selectedEstimationCardSetValue.key;
    this.savedCardSets.set(data.savedCardSets);
  }

  getCardSetDisplayValues(cardSet: CardSetValue | undefined): string {
    if (!cardSet) {
      return '';
    }
    return getSortedCardSetValues(cardSet)
      .map(item => item.value)
      .join(', ');
  }

  setEstimationCardSet(cardSet: CardSetValue) {
    this.analytics.logSelectedCardSet(cardSet.key);
    this.selectedKey = cardSet.key;
    if (cardSet.key === CustomCardSet) {
      this.estimatorService.setRoomCustomCardSetValue(
        this.room.roomId,
        cardSet
      );
    } else {
      this.estimatorService.setRoomCardSet(this.room.roomId, cardSet.key);
    }
  }

  toggleShowPassOption() {
    this.analytics.logTogglePassOption(!this.room.showPassOption);
    this.estimatorService.toggleShowPassOption(
      this.room.roomId,
      !this.room.showPassOption
    );
    this.room = { ...this.room, showPassOption: !this.room.showPassOption };
  }

  async deleteSavedCardSet(cardSetId: string) {
    if (
      await this.confirmService.openConfirmationDialog({
        title: 'Are you sure you want to delete this card set?',
        content:
          'The set will be removed from your saved sets but it will be kept in rooms where it is selected.',
        positiveText: 'Delete',
        negativeText: 'Cancel',
      })
    ) {
      this.cardDeckService.deleteCardDeck(cardSetId).subscribe(() => {
        this.savedCardSets.set(
          this.savedCardSets().filter(cs => cs.id !== cardSetId)
        );
        this.toastService.showMessage('Card set deleted');
      });
    }
  }

  openAddCardDeckModal() {
    if (this.dialog.getDialogById(ADD_CARD_DECK_MODAL) === undefined) {
      this.analytics.logClickedSetCustomCards();
      this.dialog.open(AddCardDeckModalComponent, {
        id: ADD_CARD_DECK_MODAL,
        width: '90%',
        maxWidth: '600px',
        disableClose: false,
        panelClass: 'custom-dialog',
        data: {
          roomId: this.room.roomId,
        },
      });
    }
  }
}
