import { Component, Inject } from '@angular/core';
import { from } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { PermissionsService } from 'src/app/services/permissions.service';

import { PaymentService } from 'src/app/services/payment.service';
import { MatDialog } from '@angular/material/dialog';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { RoundHistoryTableComponent } from '../round-history-table/round-history-table.component';
import { ResizeMonitorDirective } from '../directives/resize-monitor.directive';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'session-history',
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.scss'],
  animations: [],
  imports: [MatCard, ResizeMonitorDirective, RoundHistoryTableComponent],
})
export class SessionHistoryComponent {
  constructor(
    public readonly permissionsService: PermissionsService,
    public readonly paymentsService: PaymentService,
    private readonly analytics: AnalyticsService,
    private readonly dialog: MatDialog,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}
}
