import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../services/navigation.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  selector: 'app-session-history-page',
  templateUrl: './session-history-page.component.html',
  styleUrls: ['./session-history-page.component.scss'],
})
export class SessionHistoryPageComponent implements OnInit {
  constructor(private readonly navigationService: NavigationService) {}

  ngOnInit(): void {}

  goBack() {
    this.navigationService.back();
  }
}
