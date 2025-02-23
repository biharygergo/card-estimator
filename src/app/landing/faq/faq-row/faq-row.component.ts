import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';

@Component({
  selector: 'app-faq-row',
  template: `
    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>{{ question }}</mat-panel-title>
      </mat-expansion-panel-header>
      <p [innerHtml]="answer"></p>
    </mat-expansion-panel>
  `,
  styleUrls: ['./faq-row.component.scss'],
  standalone: true,
  imports: [MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle],
})
export class FaqRowComponent implements OnInit {
  @Input() question: string;
  @Input() answer: string;

  constructor() {}

  ngOnInit(): void {}
}
