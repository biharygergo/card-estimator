import { Component, OnInit } from '@angular/core';
import { ZoomAppBannerComponent } from '../../shared/zoom-app-banner/zoom-app-banner.component';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HeaderV2Component } from '../header-v2/header-v2.component';

@Component({
    selector: 'app-wrapper',
    templateUrl: './wrapper.component.html',
    styleUrls: ['./wrapper.component.scss'],
    standalone: true,
    imports: [HeaderV2Component, RouterOutlet, RouterLink, ZoomAppBannerComponent]
})
export class WrapperComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
