import { Component, OnInit } from '@angular/core';
import { CookieService } from 'src/app/services/cookie.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  isOpen = false;
  constructor(private readonly cookieService: CookieService) {}

  ngOnInit(): void {
    this.cookieService.tryShowCookieBanner();
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }
}
