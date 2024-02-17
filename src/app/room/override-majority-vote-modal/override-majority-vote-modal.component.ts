import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { EstimatorService } from 'src/app/services/estimator.service';
import { ToastService } from 'src/app/services/toast.service';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { CardSetValue } from 'src/app/types';
import { getSortedCardSetValues } from 'src/app/utils';
import { RoomDataService } from '../room-data.service';
import {
  ExportData,
  ExportedDataRow,
  createRoundStatistics,
} from 'src/app/services/serializer.service';
import { Observable, Subject, map, takeUntil, tap } from 'rxjs';

export interface MajorityOverrideModalData {
  selectedCardSet: CardSetValue;
  roundId: number;
  roomId: string;
}

export const overrideMajorityVodeModalCreator = (
  params: MajorityOverrideModalData
): ModalCreator<OverrideMajorityVoteModalComponent> => [
  OverrideMajorityVoteModalComponent,
  {
    id: 'majorityOverrideModal',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
    data: params,
  },
];
@Component({
  selector: 'app-override-majority-vote-modal',
  standalone: true,
  imports: [MatDialogModule, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './override-majority-vote-modal.component.html',
  styleUrl: './override-majority-vote-modal.component.scss',
})
export class OverrideMajorityVoteModalComponent implements OnInit, OnDestroy {
  cards: { key: string; value: string }[];

  viewModel: {
    majority: number | undefined;
    majorityOverride?: number | null;
  };
  destroy = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) private dialogData: MajorityOverrideModalData,
    private dialog: MatDialog,
    private readonly estimatorService: EstimatorService,
    private readonly toastService: ToastService,
    private readonly roomDataService: RoomDataService
  ) {
    this.cards = getSortedCardSetValues(this.dialogData.selectedCardSet);
  }

  ngOnInit() {
    this.roomDataService.room$
      .pipe(
        map((room) => {
          const stats: ExportedDataRow = createRoundStatistics(
            this.dialogData.roundId,
            room
          );
          const majority = stats.mostPopularVoteKey;
          const majorityOverride =
            room.rounds[this.dialogData.roundId]?.majorityOverride === undefined
              ? null
              : room.rounds[this.dialogData.roundId]?.majorityOverride;
          
          return {
            majority: majority ? +majority : undefined,
            majorityOverride,
          };
        }),
        takeUntil(this.destroy)
      )
      .subscribe((vm) => (this.viewModel = vm));
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async setOverride(cardKey: string | null) {
    await this.estimatorService.setMajorityOverride(
      this.dialogData.roomId,
      this.dialogData.roundId,
      cardKey ? +cardKey : null
    );
    this.toastService.showMessage('Majority override updated');
  }
}
