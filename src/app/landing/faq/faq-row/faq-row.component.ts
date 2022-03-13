import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-faq-row',
  template: `
    <section class="faq-row">
      <h2>{{ question }}</h2>
      <p [innerHtml]="answer"></p>
    </section>
  `,
  styleUrls: ['./faq-row.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FaqRowComponent implements OnInit {
  @Input() question: string;
  @Input() answer: string;

  constructor() {}

  ngOnInit(): void {}
}
