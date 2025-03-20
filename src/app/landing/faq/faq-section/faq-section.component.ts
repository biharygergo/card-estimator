import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FaqRowComponent } from '../faq-row/faq-row.component';

export type FaqRow = {
  question: string;
  answer: string;
};

@Component({
    selector: 'app-faq-section',
    imports: [FaqRowComponent, MatButtonModule, RouterLink],
    templateUrl: './faq-section.component.html',
    styleUrl: './faq-section.component.scss'
})
export class FaqSectionComponent {
  faqs = input.required<FaqRow[]>();
  inverse = input<boolean>(false);
  hideMoreButton = input<boolean>(false);
  hideTitle = input<boolean>(false);
}
