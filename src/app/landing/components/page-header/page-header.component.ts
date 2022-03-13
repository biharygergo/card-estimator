import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header>
      <h1>{{ title }}</h1>
    </header>
  `,
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent implements OnInit {
  @Input() title: string;
  constructor() {}

  ngOnInit(): void {}
}
