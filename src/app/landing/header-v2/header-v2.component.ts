import { Component, OnInit } from '@angular/core';
import { CookieService } from 'src/app/services/cookie.service';

@Component({
  selector: 'planning-poker-landing-header',
  templateUrl: './header-v2.component.html',
  styleUrls: ['./header-v2.component.scss']
})
export class HeaderV2Component implements OnInit {
  isOpen = false;
  menuOpen = false;

  constructor(private readonly cookieService: CookieService) {}

  ngOnInit(): void {
    this.cookieService.tryShowCookieBanner();
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

}
