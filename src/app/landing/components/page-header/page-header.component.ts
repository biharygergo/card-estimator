
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
<header>
  <div class="title">
    <h1>{{ title }}</h1>
    @if (subtitle) {
      <h3>{{ subtitle }}</h3>
    }
  </div>
</header>
`,
  styleUrls: ['./page-header.component.scss'],
  imports: [],
  standalone: true,
})
export class PageHeaderComponent implements OnInit {
  @Input() title: string;
  @Input() subtitle: string = '';
  constructor() {}

  ngOnInit(): void {}
}
