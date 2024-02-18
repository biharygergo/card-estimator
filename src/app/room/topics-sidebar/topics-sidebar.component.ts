import { Component, Inject, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { SerializerService } from 'src/app/services/serializer.service';
import {
  CardSetValue,
  MemberType,
  Room,
  Round,
  RoundStatistics,
} from 'src/app/types';
import { TopicEditorInputOutput } from '../topic-editor/topic-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { summaryModalCreator } from '../summary-modal/summary-modal.component';
import { batchAddModalCreator } from '../batch-add-topics-modal/batch-add-topics-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConfirmDialogService } from 'src/app/shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-topics-sidebar',
  templateUrl: './topics-sidebar.component.html',
  styleUrls: ['./topics-sidebar.component.scss'],
})
export class TopicsSidebarComponent implements OnInit {
  @Input() room: Room;
  @Input({ required: true }) room$: Observable<Room>;
  @Input() rounds: Round[];
  @Input() currentRound: number;
  @Input() roundStatistics: RoundStatistics[];
  @Input() selectedEstimationCardSetValue: CardSetValue | undefined;

  isAddingRound = false;
  editedRound = new BehaviorSubject<
    { round: Round; roundIndex: number } | undefined
  >(undefined);
  showActiveRound = true;

  readonly MemberType = MemberType;
  constructor(
    private serializer: SerializerService,
    private analytics: AnalyticsService,
    private estimatorService: EstimatorService,
    private readonly dialog: MatDialog,
    public readonly permissionsService: PermissionsService,
    private readonly confirmDialogService: ConfirmDialogService,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {}

  downloadAsCsv() {
    this.analytics.logClickedDownloadResults();
    this.serializer.exportRoomAsCsv(this.room);
  }

  async revoteRound(roundNumber: number) {
    this.analytics.logClickedReVote();
    if (
      await this.confirmDialogService.openConfirmationDialog({
        title: 'Are you sure?',
        content: 'This will clear all votes cast in this round.',
      })
    ) {
      this.estimatorService.setActiveRound(this.room, roundNumber, true);
    }
  }

  addRound() {
    this.isAddingRound = true;
    window.setTimeout(() => {
      const drawer = document.querySelector('.mat-drawer-inner-container');
      drawer?.scrollTo({ top: drawer?.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  async deleteRound(roundNumber: number) {
    if (
      await this.confirmDialogService.openConfirmationDialog({
        title: 'Are you sure?',
        content: 'This will delete this round and all associated votes',
      })
    ) {
      this.estimatorService.removeRound(this.room, roundNumber);
    }
  }

  cancelAddingRound() {
    this.isAddingRound = false;
  }

  async updateRoundConfirmed(props: TopicEditorInputOutput) {
    if (this.editedRound.value) {
      await this.estimatorService.setTopic(
        this.room,
        this.editedRound.value.roundIndex,
        props.topic,
        props.richTopic
      );
      this.editedRound.next(undefined);
    }
  }

  async addRoundConfirmed(props: TopicEditorInputOutput) {
    await this.estimatorService.addRound(
      this.room,
      props.topic,
      props.richTopic
    );
    this.analytics.logClickedAddRoundConfirmed();
    this.isAddingRound = false;
  }

  setActiveRound(roundNumber: number) {
    this.analytics.logClickedSetActiveRound();
    this.estimatorService.setActiveRound(this.room, roundNumber, false);
  }

  async drop(event: CdkDragDrop<string[]>) {
    this.showActiveRound = this.currentRound !== event.previousIndex;
    const activeRoundId = this.room.rounds[this.currentRound].id;
    moveItemInArray(this.rounds, event.previousIndex, event.currentIndex);
    await this.estimatorService.setRounds(
      this.room,
      this.rounds,
      activeRoundId
    );
    this.showActiveRound = true;
  }

  openSummaryModal() {
    this.dialog.open(...summaryModalCreator({ roomId: this.room.roomId }));
    this.analytics.logClickedSummarize();
  }

  openBatchAddModal() {
    this.dialog.open(...batchAddModalCreator({ room: this.room }));
  }

  roundIdentity(index: number, item: Round) {
    return item.id;
  }
}
