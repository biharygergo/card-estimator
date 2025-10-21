import {
  Component,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';
import { Member } from 'src/app/types';
import { trigger, transition, style, animate } from '@angular/animations';

export interface NudgeData {
  fromMember: Member;
  timestamp: number;
}

@Component({
  selector: 'app-nudge-overlay',
  templateUrl: './nudge-overlay.component.html',
  styleUrls: ['./nudge-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  animations: [
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('contentAnimation', [
      transition(':enter', [
        style({ 
          transform: 'translateX(-100%) scale(0.3) rotate(-15deg)', 
          opacity: 0 
        }),
        animate(
          '600ms 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ 
            transform: 'translateX(0) scale(1) rotate(0deg)', 
            opacity: 1 
          })
        ),
      ]),
    ]),
  ],
})
export class NudgeOverlayComponent {
  nudges = input<NudgeData[]>([]);

  getInitials(name: string): string {
    return name?.charAt(0) || '?';
  }

  getNudgeText(): string {
    const count = this.nudges().length;
    if (count === 0) return '';
    if (count === 1) {
      return `${this.nudges()[0].fromMember.name} is nudging you to vote!`;
    }
    if (count === 2) {
      return `${this.nudges()[0].fromMember.name} and ${this.nudges()[1].fromMember.name} are nudging you to vote!`;
    }
    // For 3+ nudgers
    const firstTwo = this.nudges().slice(0, 2).map(n => n.fromMember.name).join(', ');
    const remaining = count - 2;
    return `${firstTwo} and ${remaining} ${remaining === 1 ? 'other' : 'others'} are nudging you to vote!`;
  }
}

