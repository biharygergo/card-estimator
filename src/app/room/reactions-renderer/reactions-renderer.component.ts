import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie/lib/symbols';
import { Observable, Subject, delay, mergeMap, of, takeUntil } from 'rxjs';
import { ReactionsService } from 'src/app/services/reactions.service';
import { Member } from 'src/app/types';
import { LottieComponent } from 'ngx-lottie';

interface VisibleReaction {
  id: string;
  lottieOptions: AnimationOptions;
  userName: string;
  leftPosition: string;
}

@Component({
    selector: 'app-reactions-renderer',
    templateUrl: './reactions-renderer.component.html',
    styleUrls: ['./reactions-renderer.component.scss'],
    standalone: true,
    imports: [LottieComponent],
})
export class ReactionsRendererComponent implements OnInit, OnDestroy {
  @Input({ required: true }) members!: Observable<Member[]>;
  @Input({ required: true }) roomId!: string;

  visibleReactions: VisibleReaction[] = [];
  membersMap: { [userId: string]: Member };
  counter = 0;

  destroy = new Subject<void>();

  constructor(
    private readonly reactionsService: ReactionsService,
    private readonly liveAnnouncer: LiveAnnouncer,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.members.pipe(takeUntil(this.destroy)).subscribe((members) => {
      this.membersMap = members.reduce(
        (acc, curr) => ({ ...acc, [curr.id]: curr }),
        {}
      );
    });

    this.reactionsService
      .getReactionsStream(this.roomId)
      .pipe(
        mergeMap((reaction) => {
          const reactionFromDict =
            this.reactionsService.reactionsMap[reaction.reactionId];
          const visibleReaction: VisibleReaction = {
            id: reaction.id,
            lottieOptions: {
              path: reactionFromDict.lottie,
            },
            userName:
              this.membersMap[reaction.userId]?.name || 'Unknown member',
            leftPosition: `${this.randomInteger(5, 95)}%`,
          };
          this.visibleReactions.push(visibleReaction);
          this.liveAnnouncer.announce(
            `New reaction "${reactionFromDict.alt}" from ${visibleReaction.userName}`
          );

          this.counter += 1;
          this.changeDetectorRef.detectChanges();
          return of(visibleReaction).pipe(delay(4000));
        }),
        takeUntil(this.destroy)
      )
      .subscribe((reactionToRemove) => {
        this.visibleReactions = this.visibleReactions.filter(
          (reaction) => reaction.id !== reactionToRemove.id
        );
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  identify(index: number, item: VisibleReaction) {
    return item.id;
  }
}
