import { Injectable } from '@angular/core';
import Cookies from 'js-cookie';

/** Cookie key for the "Give feedback" button */
export const FEEDBACK_FORM_FILLED_COOKIE_KEY = 'feedbackForm';
/** Cookie key for hiding the permanent user banner in-game */
export const HIDE_PERMANENT_ACCOUNT_BANNER_KEY = 'hidePermanentAccountBanner';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  constructor() {}

  setCookie(key: string, value: string, expiresInDays: number = 365) {
    Cookies.set(key, value, { expires: expiresInDays });
  }

  setSessionCookie(key: string, value: string) {
    Cookies.set(key, value);
  }

  getCookie(key): string | undefined {
    return Cookies.get(key);
  }

  setLocalStorage(key: string, value: string) {
    if (window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }

  getLocalStorage(key: string): string|undefined {
    if (window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return undefined;
  }
}
