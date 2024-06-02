import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import { ZoomApiService } from './zoom-api.service';

@Injectable({ providedIn: 'root' })
export class LinkService {
  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly zoomService: ZoomApiService
  ) {}

  openUrl(url: string) {
    if (this.config.runningIn === 'zoom') {
      this.zoomService.openUrl(url, true);
    } else {
      window.open(url, '_blank');
    }
  }
}
