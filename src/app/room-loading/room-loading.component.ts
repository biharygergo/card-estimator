import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-room-loading',
  templateUrl: './room-loading.component.html',
  styleUrls: ['./room-loading.component.scss']
})
export class RoomLoadingComponent implements OnInit {
  isLoading = true;
  constructor() { }

  ngOnInit(): void {
  }

}
