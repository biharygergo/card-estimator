import { ChangeDetectionStrategy, Component, Inject, input, Input, OnInit, signal } from '@angular/core';
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
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
import { ConfirmDialogService } from 'src/app/shared/confirm-dialog/confirm-dialog.service';
import { AsyncPipe } from '@angular/common';
import { AddOrUpdateTopicComponent } from './add-or-update-topic/add-or-update-topic.component';
import { MatListSubheaderCssMatStyler } from '@angular/material/list';
import { RoundResultsComponent } from '../round-results/round-results.component';
import { RichTopicComponent } from '../rich-topic/rich-topic.component';
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
} from '@angular/material/expansion';
import { MatDivider } from '@angular/material/divider';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton, MatButton } from '@angular/material/button';
import { VelocityComponent } from '../velocity/velocity.component';
import { batchImportTopicsModalCreator } from '../batch-import-topics-modal/batch-import-topics-modal.component';

@Component({
  selector: 'app-topics-sidebar',
  templateUrl: './topics-sidebar.component.html',
  styleUrls: ['./topics-sidebar.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VelocityComponent,
    MatIconButton,
    MatTooltip,
    MatIcon,
    CdkDropList,
    MatCard,
    CdkDrag,
    MatCardContent,
    CdkDragHandle,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatDivider,
    MatExpansionPanel,
    MatExpansionPanelContent,
    RichTopicComponent,
    RoundResultsComponent,
    MatListSubheaderCssMatStyler,
    AddOrUpdateTopicComponent,
    MatButton,
    AsyncPipe,
  ],
})
export class TopicsSidebarComponent implements OnInit {
  room = input.required<Room>();
  @Input({ required: true }) room$: Observable<Room>;
  rounds = input.required<Round[]>();
  currentRound = input.required<number>();
  roundStatistics = input.required<RoundStatistics[]>();
  selectedEstimationCardSetValue = input<CardSetValue | undefined>(undefined);

  isAddingRound = signal<boolean>(false);
  editedRound = new BehaviorSubject<
    { round: Round; roundIndex: number } | undefined
  >(undefined);
  showActiveRound = signal<boolean>(true);

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
    this.serializer.exportRoomAsCsv(this.room());
  }

  async revoteRound(roundNumber: number) {
    this.analytics.logClickedReVote();
    if (
      await this.confirmDialogService.openConfirmationDialog({
        title: 'Are you sure?',
        content: 'This will clear all votes cast in this round.',
      })
    ) {
      this.estimatorService.setActiveRound(this.room(), roundNumber, true);
    }
  }

  addRound() {
    this.isAddingRound.set(true);
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
      this.estimatorService.removeRound(this.room(), roundNumber);
    }
  }

  cancelAddingRound() {
    this.isAddingRound.set(false);
  }

  async updateRoundConfirmed(props: TopicEditorInputOutput) {
    if (this.editedRound.value) {
      await this.estimatorService.setTopic(
        this.room(),
        this.editedRound.value.roundIndex,
        props.topic,
        props.richTopic
      );
      this.editedRound.next(undefined);
    }
  }

  async addRoundConfirmed(props: TopicEditorInputOutput) {
    await this.estimatorService.addRound(
      this.room(),
      props.topic,
      props.richTopic
    );
    this.analytics.logClickedAddRoundConfirmed();
    this.isAddingRound.set(false);
  }

  setActiveRound(roundNumber: number) {
    this.analytics.logClickedSetActiveRound();
    this.estimatorService.setActiveRound(this.room(), roundNumber, false);
  }

  async drop(event: CdkDragDrop<string[]>) {
    this.showActiveRound.set(this.currentRound() !== event.previousIndex);
    const activeRoundId = this.room().rounds[this.currentRound()].id;
    const mutableRounds = [...this.rounds()];
    moveItemInArray(mutableRounds, event.previousIndex, event.currentIndex);
    await this.estimatorService.setRounds(
      this.room(),
      mutableRounds,
      activeRoundId
    );
    this.showActiveRound.set(true);
  }

  openSummaryModal() {
    this.dialog.open(...summaryModalCreator({ roomId: this.room().roomId }));
    this.analytics.logClickedSummarize();
  }

  openBatchAddModal() {
    this.dialog.open(...batchAddModalCreator({ room: this.room() }));
  }

  openBatchImportModal() {
    this.analytics.logClickedBatchImportTopicsModal();
    this.dialog.open(...batchImportTopicsModalCreator());
  }

  roundIdentity(index: number, item: Round) {
    return item.id;
  }

  toggleReveal(roundNumber: number, reveal: boolean) {
    this.estimatorService.setShowResults(this.room(), roundNumber, reveal);
  }
}
