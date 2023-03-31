import { Component, OnInit } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-integration-result',
  templateUrl: './integration-result.component.html',
  styleUrls: ['./integration-result.component.scss'],
  standalone: true,
  imports: [
    SharedModule
  ]
})
export class IntegrationResultComponent {
}
