import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-room-loading',
  templateUrl: './room-loading.component.html',
  styleUrls: ['./room-loading.component.scss'],
  imports: [RouterOutlet, MatCardModule],
})
export class RoomLoadingComponent implements OnInit {
  isLoading = true;
  constructor() {}

  ngOnInit(): void {}

  roomLoaded() {
    window.setTimeout(() => (this.isLoading = false), 10);
  }
}
