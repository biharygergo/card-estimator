import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
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
export class CardDeckComponent implements OnInit, OnDestroy {
  @Input() room: Room;
  @Input() currentRound: number;
  @Input() isObserver: boolean;
  @Input() estimationValues: { key: string; value: string }[];
  @Input() currentEstimate: number;

  readonly reactions: ReactionOption[] = this.reactionsService.reactionsList;

  onReaction = new Subject<string>();

  showReactions = true;
  onDestroy = new Subject<void>();

  constructor(
    private analytics: AnalyticsService,
    private estimatorService: EstimatorService,
    public permissionsService: PermissionsService,
    private readonly reactionsService: ReactionsService
  ) {}

  ngOnInit(): void {
    this.onReaction
      .pipe(debounceTime(100), takeUntil(this.onDestroy))
      .subscribe((reactionId) => this.sendReaction(reactionId));
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

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

  private sendReaction(reactionId: string) {
    return this.reactionsService.sendReaction(reactionId, this.room.roomId);
  }
}
