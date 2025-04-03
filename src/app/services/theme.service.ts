import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject, combineLatest } from 'rxjs';
import { ConfigService } from './config.service';
import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { MediaMatcher } from '@angular/cdk/layout';

export enum Theme {
  DARK = 'dark-theme',
  DEFAULT = 'default-theme',
  AUTOMATIC = 'automatic',
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  themeSetting = new BehaviorSubject<Theme>(Theme.AUTOMATIC);

  prefersDarkMatcher = this.mediaMatcher.matchMedia(
    '(prefers-color-scheme: dark)'
  );
  systemTheme = new BehaviorSubject<'dark' | 'light'>(
    this.prefersDarkMatcher.matches ? 'dark' : 'light'
  );

  themeValue = combineLatest([this.themeSetting, this.systemTheme]).pipe(
    map(([setting, systemTheme]) => {
      if (setting === Theme.AUTOMATIC) {
        return systemTheme === 'dark' ? Theme.DARK : Theme.DEFAULT;
      }

      return setting;
    })
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly mediaMatcher: MediaMatcher
  ) {
    if (this.prefersDarkMatcher.addEventListener) {
      this.prefersDarkMatcher.addEventListener(
        'change',
        (event: MediaQueryListEvent) => {
          this.systemTheme.next(event.matches ? 'dark' : 'light');
        }
      );
    }

    const themeFromCookie = this.configService.getCookie('preferredTheme');
    if (
      themeFromCookie &&
      Object.values(Theme).includes(themeFromCookie as Theme) &&
      themeFromCookie !== this.themeSetting.value
    ) {
      this.themeSetting.next(themeFromCookie as Theme);
    }
  }

  setTheme(theme: Theme) {
    this.themeSetting.next(theme);
    this.configService.setCookie('preferredTheme', theme);
  }
}
