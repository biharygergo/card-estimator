import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'planning-poker-features-items',
  templateUrl: './features-items.component.html',
  styleUrl: './features-items.component.scss',
  imports: [NgOptimizedImage, MatAnchor, RouterLink, MatIcon],
})
export class FeaturesItemsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) loadVideos: Observable<boolean>;

  destroy = new Subject<void>();

  ngOnInit() {
    this.loadVideos.pipe(takeUntil(this.destroy)).subscribe(shouldLoad => {
      if (shouldLoad && typeof window !== 'undefined') {
        const videoChildren = document.querySelectorAll('video');
        videoChildren.forEach(viewChild => {
          for (const source in viewChild.children) {
            var videoSource = viewChild.children[source];
            if (
              typeof videoSource.tagName === 'string' &&
              videoSource.tagName === 'SOURCE'
            ) {
              (videoSource as HTMLSourceElement).src = (
                videoSource as HTMLSourceElement
              ).dataset.src;
            }
          }
          viewChild.load();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}
