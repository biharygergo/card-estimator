import { Component, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../components/page-header/page-header.component';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
  imports: [PageHeaderComponent],
})
export class PrivacyComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
