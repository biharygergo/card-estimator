import { Injectable } from '@angular/core';
import Cookies from 'js-cookie';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  constructor() {}

  setCookie(key: string, value: string, expiresInDays: number = 365) {
    Cookies.set(key, value, { expires: expiresInDays, sameSite: 'None', secure: true });
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
