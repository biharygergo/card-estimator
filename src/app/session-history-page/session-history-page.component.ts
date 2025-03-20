import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../services/navigation.service';
import { AnonymousUserBannerComponent } from '../shared/anonymous-user-banner/anonymous-user-banner.component';
import { SessionHistoryComponent } from '../shared/session-history/session-history.component';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    imports: [
        CommonModule,
        RouterModule,
        AnonymousUserBannerComponent,
        SessionHistoryComponent,
        MatIconModule,
        MatButtonModule,
    ],
    selector: 'app-session-history-page',
    templateUrl: './session-history-page.component.html',
    styleUrls: ['./session-history-page.component.scss']
})
export class SessionHistoryPageComponent implements OnInit {
  constructor(private readonly navigationService: NavigationService) {}

  ngOnInit(): void {}

  goBack() {
    this.navigationService.back();
  }
}
