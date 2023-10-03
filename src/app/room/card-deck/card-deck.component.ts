import { Component, Input, OnInit } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { Room } from 'src/app/types';

interface ReactionOption {
  id: string;
  webp: string;
  gif: string;
  svg: string;
  alt: string;
}

/*

<picture>
  <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f604/512.webp" type="image/webp">
  <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f604/512.gif" alt="😄" width="32" height="32">
</picture>
*/

const createWebpUrl = (id: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.webp`;
const createGifUrl = (id: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.gif`;
  const createSvgUrl = (id: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/emoji.svg`;

const REACTIONS: Pick<ReactionOption, 'id' | 'alt'>[] = [
  {
    id: '1f604',
    alt: '😄',
  },
  {
    id: '1f389',
    alt: '🎉'
  },
  {
    id: '1f4b8',
    alt: '💸'
  },
  {
    id: '1f914',
    alt: '🤔'
  },
  {
    id: '1f625',
    alt: '😥'
  },
  {
    id: '1f44d',
    alt: '👍'
  },
  {
    id: '1f44e',
    alt: '👎'
  },
  
];

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

  readonly reactions: ReactionOption[] = REACTIONS.map((reaction) => ({
    ...reaction,
    webp: createWebpUrl(reaction.id),
    gif: createGifUrl(reaction.id),
    svg: createSvgUrl(reaction.id)
  }));

  showReactions = true;

  constructor(
    private analytics: AnalyticsService,
    private estimatorService: EstimatorService,
    public permissionsService: PermissionsService
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
}
