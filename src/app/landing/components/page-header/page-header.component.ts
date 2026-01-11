import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-page-header',
  template: `
    <header [class.compact]="compact">
      <div class="header-content" [class.centered]="centered">
        @if (breadcrumbs.length > 0) {
          <nav class="breadcrumbs" aria-label="Breadcrumb">
            @for (crumb of breadcrumbs; track crumb.url; let last = $last) {
              <a [routerLink]="crumb.url">{{ crumb.label }}</a>
              @if (!last) {
                <span class="separator">/</span>
              }
            }
          </nav>
        }
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <h2>{{ subtitle }}</h2>
        }
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styleUrls: ['./page-header.component.scss'],
  imports: [RouterLink],
})
export class PageHeaderComponent implements OnInit {
  @Input() title: string;
  @Input() subtitle: string = '';
  @Input() centered: boolean = false;
  @Input() compact: boolean = false;
  @Input() breadcrumbs: Breadcrumb[] = [];
  
  constructor() {}

  ngOnInit(): void {}
}
