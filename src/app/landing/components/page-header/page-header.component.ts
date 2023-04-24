import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header>
      <div class="title">
        <h1>{{ title }}</h1>
        <h3 *ngIf="subtitle">{{ subtitle }}</h3>
      </div>
    </header>
  `,
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent implements OnInit {
  @Input() title: string;
  @Input() subtitle: string = '';
  constructor() {}

  ngOnInit(): void {}
}
