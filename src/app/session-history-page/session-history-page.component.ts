import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { NavigationService } from '../services/navigation.service';

@Component({
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
