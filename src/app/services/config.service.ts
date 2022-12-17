import { Injectable } from '@angular/core';
import { RemoteConfig } from '@angular/fire/remote-config';
import {
  ensureInitialized,
  fetchAndActivate,
  getBoolean,
} from 'firebase/remote-config';
import Cookies from 'js-cookie';

/** Cookie key for the "Give feedback" button */
export const FEEDBACK_FORM_FILLED_COOKIE_KEY = 'feedbackForm';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  constructor(private remoteConfig: RemoteConfig) {
    fetchAndActivate(remoteConfig);
  }

  async isEnabled(key: string) {
    await ensureInitialized(this.remoteConfig);
    return getBoolean(this.remoteConfig, key);
  }

  setCookie(key: string, value: string) {
    Cookies.set(key, value);
  }

  getCookie(key): string|undefined {
    return Cookies.get(key);
  }

}
