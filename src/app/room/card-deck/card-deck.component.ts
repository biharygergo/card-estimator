import { Component, Input, OnInit } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { Room } from 'src/app/types';

@Component({
  selector: 'app-card-deck',
  templateUrl: './card-deck.component.html',
  styleUrls: ['./card-deck.component.scss'],
})
export class CardDeckComponent implements OnInit {
  @Input() room: Room;
  @Input() currentRound: number;
  @Input() isObserver: boolean;
  @Input() estimationValues: { key: string; value: string }[];
  @Input() currentEstimate: number;

  
  constructor(
    private analytics: AnalyticsService,
    private estimatorService: EstimatorService,
    public permissionsService: PermissionsService,
  ) {}

  ngOnInit(): void {}

  setEstimate(amount: number) {
    this.analytics.logClickedVoteOption();
    this.estimatorService.setEstimate(
      this.room,
      this.currentRound,
      +amount,
      this.estimatorService.activeMember.id
    );
  }

  setWildcard() {
    this.estimatorService.setEstimate(
      this.room,
      this.currentRound,
      null,
      this.estimatorService.activeMember.id
    );
  }
}
