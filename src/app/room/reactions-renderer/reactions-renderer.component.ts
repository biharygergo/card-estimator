import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AnimationOptions, LottieOptions } from 'ngx-lottie/lib/symbols';
import {
  Observable,
  Subject,
  delay,
  mergeMap,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import {
  Reaction,
  ReactionOption,
  ReactionsService,
} from 'src/app/services/reactions.service';
import { Member } from 'src/app/types';

interface VisibleReaction {
  id: string;
  reactionOption: ReactionOption;
  lottieOptions: AnimationOptions;
  userName: string;
  leftPosition: string;
}

@Component({
  selector: 'app-reactions-renderer',
  templateUrl: './reactions-renderer.component.html',
  styleUrls: ['./reactions-renderer.component.scss'],
})
export class ReactionsRendererComponent implements OnInit, OnDestroy {
  @Input({ required: true }) members!: Observable<Member[]>;
  @Input({ required: true }) roomId!: string;

  visibleReactions: VisibleReaction[] = [];
  membersMap: { [userId: string]: Member };

  destroy = new Subject<void>();

  constructor(private readonly reactionsService: ReactionsService) {}

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
          console.log('got reaction', reaction);
          const visibleReaction: VisibleReaction = {
            id: reaction.id,
            reactionOption:
              this.reactionsService.reactionsMap[reaction.reactionId],
            lottieOptions: {
              path: this.reactionsService.reactionsMap[reaction.reactionId]
                .lottie,
            },
            userName:
              this.membersMap[reaction.userId]?.name || 'Unknown member',
            leftPosition: `${this.randomInteger(0, 100)}%`,
          };
          this.visibleReactions.push(visibleReaction);

          return of(visibleReaction).pipe(delay(2000));
        }),
        takeUntil(this.destroy)
      )
      .subscribe((reactionToRemove) => {
        console.log('finish?');
        this.visibleReactions = this.visibleReactions.filter(
          (reaction) => reaction.id !== reactionToRemove.id
        );
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
