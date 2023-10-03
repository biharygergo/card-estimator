import { Component, Input, OnInit } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import {
  ReactionOption,
  ReactionsService,
} from 'src/app/services/reactions.service';
import { fadeAnimation } from 'src/app/shared/animations';
import { Room } from 'src/app/types';

@Component({
  selector: 'app-card-deck',
  templateUrl: './card-deck.component.html',
  styleUrls: ['./card-deck.component.scss'],
  animations: [fadeAnimation],
})
export class CardDeckComponent implements OnInit {
  @Input() room: Room;
  @Input() currentRound: number;
  @Input() isObserver: boolean;
  @Input() estimationValues: { key: string; value: string }[];
  @Input() currentEstimate: number;

  readonly reactions: ReactionOption[] = this.reactionsService.reactionsList;

  showReactions = true;

  constructor(
    private analytics: AnalyticsService,
    private estimatorService: EstimatorService,
    public permissionsService: PermissionsService,
    private readonly reactionsService: ReactionsService
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

  toggleReactions() {
    this.showReactions = !this.showReactions;
  }

  sendReaction(reactionId: string) {
    return this.reactionsService.sendReaction(reactionId, this.room.roomId);
  }
}
