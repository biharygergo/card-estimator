import { NgModule, InjectionToken } from '@angular/core';
import {
  isRunningInWebex,
  isRunningInTeams,
  isRunningInZoom,
  isRunningInMeet,
} from './utils';
import { Platform } from './types';

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

function getPlatform(): Platform {
  if (isRunningInZoom()) {
    return 'zoom';
  } else if (isRunningInWebex()) {
    return 'webex';
  } else if (isRunningInTeams()) {
    return 'teams';
  } else if (isRunningInMeet()) {
    return 'meet';
  }

  return 'web';
}

export class AppConfig {
  runningIn: Platform;
}

export const APP_DI_CONFIG: AppConfig = {
  runningIn: getPlatform(),
};

@NgModule({
  providers: [
    {
      provide: APP_CONFIG,
      useValue: APP_DI_CONFIG,
    },
  ],
})
export class AppConfigModule {}
