import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header>
      <div class="title" [class.centered]="centered">
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <h2>{{ subtitle }}</h2>
        }
      </div>
    </header>
  `,
  styleUrls: ['./page-header.component.scss'],
  imports: [],
})
export class PageHeaderComponent implements OnInit {
  @Input() title: string;
  @Input() subtitle: string = '';
  @Input() centered: boolean = false;
  constructor() {}

  ngOnInit(): void {}
}
