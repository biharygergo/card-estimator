import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { SerializerService } from 'src/app/services/serializer.service';
import { CardSetValue, Room, Round, RoundStatistics } from 'src/app/types';

@Component({
  selector: 'app-topics-sidebar',
  templateUrl: './topics-sidebar.component.html',
  styleUrls: ['./topics-sidebar.component.scss'],
})
export class TopicsSidebarComponent implements OnInit {
  @Input() room: Room;
  @Input() rounds: Round[];
  @Input() currentRound: number;
  @Input() roundStatistics: RoundStatistics[];
  @Input() selectedEstimationCardSetValue: CardSetValue | undefined;

  isAddingRound = false;
  sidebarRoundTopicForm = new FormControl('');

  constructor(
    private serializer: SerializerService,
    private analytics: AnalyticsService,
    private estimatorService: EstimatorService,
  ) {}

  ngOnInit(): void {}

  downloadAsCsv() {
    this.analytics.logClickedDownloadResults();
    this.serializer.exportRoomAsCsv(this.room);
  }

  revoteRound(roundNumber: number) {
    this.analytics.logClickedReVote();
    this.estimatorService.setActiveRound(this.room, roundNumber, true);
  }

  addRound() {
    this.isAddingRound = true;
    window.setTimeout(() => {
      const drawer = document.querySelector('.mat-drawer-inner-container');
      drawer?.scrollTo({ top: drawer?.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  cancelAddingRound() {
    this.isAddingRound = false;
  }

  async addRoundConfirmed() {
    await this.estimatorService.addRound(
      this.room,
      this.sidebarRoundTopicForm.value
    );
    this.sidebarRoundTopicForm.setValue('');
    this.isAddingRound = false;
  }

  setActiveRound(roundNumber: number) {
    // this.analytics.logClickedSetActiveRound();
    this.estimatorService.setActiveRound(this.room, roundNumber, false);
  }
}
