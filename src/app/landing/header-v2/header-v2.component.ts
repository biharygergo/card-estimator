import { Component, Inject, OnInit } from '@angular/core';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { CookieService } from 'src/app/services/cookie.service';
import { NavigationService } from 'src/app/services/navigation.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatAnchor, MatIconButton } from '@angular/material/button';
import { NgClass } from '@angular/common';

@Component({
    selector: 'planning-poker-landing-header',
    templateUrl: './header-v2.component.html',
    styleUrls: ['./header-v2.component.scss'],
    standalone: true,
    imports: [
        NgClass,
        MatButton,
        MatIcon,
        RouterLink,
        RouterLinkActive,
        MatMenuTrigger,
        MatMenu,
        MatMenuItem,
        MatAnchor,
        MatIconButton,
    ],
})
export class HeaderV2Component implements OnInit {
  isOpen = false;
  menuOpen = false;

  isEmbeddedApp = this.config.runningIn !== 'web';

  constructor(
    private readonly cookieService: CookieService,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly historyService: NavigationService
  ) {}

  ngOnInit(): void {
    this.cookieService.tryShowCookieBanner();
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  goBack() {
    this.historyService.back();
  }
}
