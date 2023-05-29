import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

export const delayedFadeAnimation = trigger('delayedFadeAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('100ms 300ms', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    style({ opacity: 1 }),
    animate('100ms 300ms', style({ opacity: 0 })),
  ]),
]);

export const slideInRightAnimation = trigger('slideInRightAnimation', [
  transition(':enter', [
    style({ opacity: 0, width: 0 }),
    animate('200ms 300ms', style({ opacity: 1, width: '*' })),
  ]),
  transition(':leave', [
    style({ opacity: 1 }),
    animate('200ms 300ms', style({ opacity: 0 })),
  ]),
]);

export const fadeAnimation = trigger('fadeAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('150ms', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    style({ opacity: 1 }),
    animate('150ms', style({ opacity: 0 })),
  ]),
]);

export const fadeOutDownAnimation = trigger('fadeOutDownAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-300px)' }),
    animate('150ms', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    style({ opacity: 1, transform: 'translateY(0)' }),
    animate('150ms', style({ opacity: 0, transform: 'translateY(300px)' })),
  ]),
]);

export const bounceAnimation = trigger('bounceAnimation', [
  transition(':increment', [
    query(':self', [
      style({ transform: 'scale(1)' }),
      stagger(50, [
        animate('80ms ease-out', style({ transform: 'scale(1.08)' })),
        animate('80ms ease-out', style({ transform: 'scale(0.95)' })),
        animate('80ms ease-out', style({ transform: 'scale(1.04)' })),
        animate('80ms ease-out', style({ transform: 'scale(1)' })),
      ]),
    ]),
  ]),
]);

export const staggerFadeAnimation = trigger('staggerFadeAnimation', [
  transition('* => *', [
    // each time the binding value changes
    query(':leave', [stagger(100, [animate('100ms', style({ opacity: 0 }))])], {
      optional: true,
    }),
    query(
      ':enter',
      [
        style({ opacity: 0 }),
        stagger(100, [animate('100ms', style({ opacity: 1 }))]),
      ],
      { optional: true }
    ),
  ]),
]);
