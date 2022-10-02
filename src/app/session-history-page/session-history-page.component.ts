import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-session-history-page',
  templateUrl: './session-history-page.component.html',
  styleUrls: ['./session-history-page.component.scss'],
})
export class SessionHistoryPageComponent implements OnInit {
  backToPage = this.route.queryParamMap.pipe(
    map((paramMap) => paramMap.get('backToPage'))
  );

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {}
}
