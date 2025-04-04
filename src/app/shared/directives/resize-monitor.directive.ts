import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { debounceTime, Subject, takeUntil, tap } from 'rxjs';

export interface ResizeEventData {
  width: number;
  height: number;
}

@Directive({
  selector: '[resizeMonitor]',
  standalone: true,
})
export class ResizeMonitorDirective implements OnInit, OnDestroy {
  @Input() verticalSpacing: number;
  @Output() readonly onResized = new EventEmitter<ResizeEventData>();

  readonly onSizeChange = new Subject<ResizeEventData>();
  readonly destroyed = new Subject<void>();

  resizeObserver: ResizeObserver;
  constructor(
    private readonly elementRef: ElementRef,
    private readonly zone: NgZone
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(entries => {
        this.zone.run(() => {
          if (entries.length && entries[0].contentRect) {
            const width = entries[0].contentRect.width;
            const height = entries[0].contentRect.height;
            this.onSizeChange.next({ width, height });
          }
        });
      });

      this.resizeObserver.observe(
        (this.elementRef.nativeElement as HTMLDivElement).firstElementChild
      );
    }

    this.onSizeChange
      .pipe(
        tap(data => this.onResized.emit(data)),
        tap(data => {
          (this.elementRef.nativeElement as HTMLDivElement).style.height =
            data.height + this.verticalSpacing + 'px';
        }),
        takeUntil(this.destroyed)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
    this.resizeObserver?.unobserve(this.elementRef.nativeElement);
  }
}
