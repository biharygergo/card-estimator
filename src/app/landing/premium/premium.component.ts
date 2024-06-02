import { Component } from '@angular/core';
import { PricingTableComponent } from 'src/app/shared/pricing-table/pricing-table.component';

@Component({
  selector: 'app-premium',
  templateUrl: './premium.component.html',
  styleUrls: ['./premium.component.scss'],
  standalone: true,
  imports: [
    PricingTableComponent
]
})
export class PremiumComponent {

}
