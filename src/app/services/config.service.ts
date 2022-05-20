import { Injectable } from '@angular/core';
import { RemoteConfig, getAllChanges } from '@angular/fire/remote-config';
import {
  ensureInitialized,
  fetchAndActivate,
  getBoolean,
} from 'firebase/remote-config';

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
}
