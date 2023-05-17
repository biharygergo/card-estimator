import { NgModule, InjectionToken } from '@angular/core';
import { isRunningInWebex, isRunningInZoom } from './utils';

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

export class AppConfig {
  isRunningInZoom: boolean;
  isRunningInWebex: boolean;
}

export const APP_DI_CONFIG: AppConfig = {
  isRunningInZoom: isRunningInZoom(),
  isRunningInWebex: isRunningInWebex(),
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
