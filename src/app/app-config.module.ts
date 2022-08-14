import { NgModule, InjectionToken } from '@angular/core';
import { environment } from '../environments/environment';
import { isRunningInZoom } from './utils';

export let APP_CONFIG = new InjectionToken<AppConfig>('app.config');

export class AppConfig {
    isRunningInZoom: boolean;
}

export const APP_DI_CONFIG: AppConfig = {
  isRunningInZoom: isRunningInZoom()
};

@NgModule({
  providers: [{
    provide: APP_CONFIG,
    useValue: APP_DI_CONFIG
  }]
})
export class AppConfigModule { }