import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
import { ToastService } from 'src/app/services/toast.service';

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

  onCardOptionsClick = input<() => void>();
  
  @ViewChildren('cardContainer')
  cardContainers: QueryList<ElementRef<HTMLDivElement>>;

  @ViewChild('cardDeck') cardDeckContainer: ElementRef<HTMLDivElement>;
  
  isMinimized = signal(false);

  readonly reactions: ReactionOption[] = this.reactionsService.reactionsList;
  readonly clickCounter = signal(0);

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
    private readonly roomDataService: RoomDataService,
    private readonly toastService: ToastService
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

  onCardKeydown(event: KeyboardEvent) {
    const buttons = this.cardContainers
      .toArray()
      .map(ref => ref.nativeElement.querySelector<HTMLButtonElement>('button'))
      .filter((b): b is HTMLButtonElement => !!b && !b.disabled);

    const focused = document.activeElement as HTMLButtonElement;
    const idx = buttons.indexOf(focused);
    if (idx === -1) return;

    let next = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (idx + 1) % buttons.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (idx - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = buttons.length - 1;
    }

    if (next !== -1) {
      event.preventDefault();
      buttons.forEach((b, i) => b.setAttribute('tabindex', i === next ? '0' : '-1'));
      buttons[next].focus();
    }
  }

  disabledClick() {
    this.clickCounter.set(this.clickCounter() + 1);
    if (this.clickCounter() === 3) {
      this.toastService.showMessage(
        'You cannot change your vote after the results are revealed. You can configure this in Room settings > Voting options.',
        5000
      );
    }
  }
}
