import { Component, Input, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-glossary-link',
  template: `
    <a 
      routerLink="/glossary" 
      [fragment]="termId" 
      [class]="className"
      (click)="handleClick($event)">
      <ng-content></ng-content>
    </a>
  `,
  styles: [`
    a {
      color: #4f7cff;
      text-decoration: none;
      font-weight: 500;
      border-bottom: 1px dotted rgba(79, 124, 255, 0.5);
      transition: border-color 0.3s ease;
      cursor: pointer;

      &:hover {
        border-bottom-color: #4f7cff;
        text-decoration: none;
      }

      // When used as term-anchor in glossary headings, inherit parent styles
      &.term-anchor {
        border-bottom: none;
        font-weight: inherit;
        
        &:hover {
          border-bottom: none;
        }
      }
    }
  `],
  imports: [RouterLink],
})
export class GlossaryLinkComponent {
  @Input() term!: string;
  @Input() className: string = '';

  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  get termId(): string {
    return this.term.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }

  handleClick(event: Event): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // If we're already on the glossary page, prevent default and just scroll
    const currentUrl = this.router.url.split('#')[0];
    if (currentUrl === '/glossary') {
      event.preventDefault();
      event.stopPropagation();
      // Update URL manually without triggering router navigation to avoid double scroll
      window.history.pushState(null, '', `/glossary#${this.termId}`);
      // Only scroll - CSS scroll-margin-top will handle the offset
      setTimeout(() => {
        const element = document.getElementById(this.termId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 10);
    }
    // Otherwise, navigate - let Angular's anchorScrolling handle the scroll automatically
    else {
      event.preventDefault();
      // Let Angular's anchorScrolling handle the scroll (respects scroll-margin-top)
      this.router.navigate(['/glossary'], { fragment: this.termId });
    }
  }
}

