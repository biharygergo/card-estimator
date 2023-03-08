import { Component } from '@angular/core';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

export const premiumLearnMoreModalCreator =
  (): ModalCreator<PremiumLearnMoreComponent> => [
    PremiumLearnMoreComponent,
    {
      id: 'premiumLearnMoreModal',
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
    },
  ];

@Component({
  selector: 'app-premium-learn-more',
  templateUrl: './premium-learn-more.component.html',
  styleUrls: ['./premium-learn-more.component.scss']
})
export class PremiumLearnMoreComponent {

}
