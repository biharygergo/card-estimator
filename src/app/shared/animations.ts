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
    animate('200ms', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    style({ opacity: 1 }),
    animate('200ms', style({ opacity: 0 })),
  ]),
]);

export const staggerFadeAnimation = trigger('staggerFadeAnimation', [
  transition('* => *', [
    // each time the binding value changes
    query(
      ':leave',
      [
        stagger(100, [
          animate('100ms', style({ opacity: 0 })),
        ]),
      ],
      {
        optional: true,
      }
    ),
    query(
      ':enter',
      [
        style({ opacity: 0 }),
        stagger(100, [
          animate('100ms', style({ opacity: 1})),
        ]),
      ],
      { optional: true }
    ),
  ]),
]);
