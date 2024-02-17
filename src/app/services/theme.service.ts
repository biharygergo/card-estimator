import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ConfigService } from './config.service';
import { map } from 'rxjs/operators';

export enum Theme {
  DARK = 'dark-theme',
  DEFAULT = 'default-theme',
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  currentTheme = Theme.DEFAULT;
  themeChanged = new Subject<void>();

  constructor(private readonly configService: ConfigService) {
    const themeFromCookie = this.configService.getCookie('preferredTheme');
    if (
      themeFromCookie &&
      Object.values(Theme).includes(themeFromCookie as Theme) &&
      themeFromCookie !== this.currentTheme
    ) {
      this.currentTheme = themeFromCookie as Theme;
      this.themeChanged.next();
    }
  }

  setTheme(theme: Theme) {
    this.currentTheme = theme;
    this.themeChanged.next();
    this.configService.setCookie('preferredTheme', theme);
  }
}
