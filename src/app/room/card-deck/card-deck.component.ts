import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  input,
  signal,
} from '@angular/core';
import { Subject, debounceTime, from, map, mergeMap, takeUntil } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import {
  ReactionOption,
  ReactionsService,
} from 'src/app/services/reactions.service';
import { fadeAnimation } from 'src/app/shared/animations';
import { MemberType, Room } from 'src/app/types';
import { AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton, MatButton } from '@angular/material/button';
import { RoomDataService } from '../room-data.service';

@Component({
  selector: 'app-card-deck',
  templateUrl: './card-deck.component.html',
  styleUrls: ['./card-deck.component.scss'],
  animations: [fadeAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatTooltip,
    MatButton,
    MatButtonToggle,
    MatIcon,
    AsyncPipe,
  ],
})
export class CardDeckComponent implements OnInit, OnDestroy {
  room = input.required<Room>();
  currentRound = input.required<number>();
  estimationValues = input.required<{ key: string; value: string }[]>();
  currentEstimate = input.required<number>();

  @ViewChildren('cardContainer')
  cardContainers: QueryList<ElementRef<HTMLDivElement>>;

  @ViewChild('cardDeck') cardDeckContainer: ElementRef<HTMLDivElement>;

  isMinimized = signal(false);

  readonly reactions: ReactionOption[] = this.reactionsService.reactionsList;

  onReaction = new Subject<string>();

  showReactions = signal<boolean>(true);
  onDestroy = new Subject<void>();

  isObserver = this.roomDataService.activeMember$.pipe(
    map(member => member?.type === MemberType.OBSERVER)
  );

  constructor(
    private analytics: AnalyticsService,
    private estimatorService: EstimatorService,
    public permissionsService: PermissionsService,
    private readonly reactionsService: ReactionsService,
    private readonly roomDataService: RoomDataService
  ) {}

  ngOnInit(): void {
    this.onReaction
      .pipe(
        debounceTime(100),
        mergeMap(reactionId => from(this.sendReaction(reactionId))),
        takeUntil(this.onDestroy)
      )
      .subscribe();

    this.isObserver.pipe(takeUntil(this.onDestroy)).subscribe(isObserver => {
      if (isObserver && !this.isMinimized()) {
        this.toggleMinimize();
      }
    });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  setEstimate(amount: string) {
    this.analytics.logClickedVoteOption();
    this.estimatorService.setEstimate(
      this.room(),
      this.currentRound(),
      +amount,
      this.estimatorService.activeMember.id
    );
  }

  setWildcard() {
    this.estimatorService.setEstimate(
      this.room(),
      this.currentRound(),
      null,
      this.estimatorService.activeMember.id
    );
  }

  toggleReactions() {
    this.showReactions.set(!this.showReactions());
    this.analytics.logToggledReactions();
  }

  toggleMinimize() {
    if (!this.isMinimized()) {
      this.cardDeckContainer.nativeElement.style.minWidth = `${this.cardDeckContainer.nativeElement.offsetWidth}px`;
    } else {
      this.cardDeckContainer.nativeElement.style.minWidth = '';
    }

    this.isMinimized.set(!this.isMinimized());
  }

  private async sendReaction(reactionId: string) {
    await this.reactionsService.sendReaction(reactionId, this.room().roomId);
    this.analytics.logClickedReaction(reactionId);
  }
}
