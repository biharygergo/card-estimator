import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EMPTY,
  Observable,
  Subject,
  combineLatest,
  delay,
  filter,
  from,
  map,
  of,
  takeUntil,
} from 'rxjs';
import { PaymentService } from 'src/app/services/payment.service';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnalyticsService } from 'src/app/services/analytics.service';

interface ViewModel {
  showAds: boolean;
  carbonSrc: string;
}

const createCarbonSrc = (placement: 'landing' | 'app') => {
  const isRunningInCypress = (window as any).Cypress !== undefined;
  const isDevelopment = window.location.origin.includes('localhost');

  const shouldIgnore = isRunningInCypress || isDevelopment;
  const ignoreParam = shouldIgnore ? '&ignore=yes' : '';

  return `//cdn.carbonads.com/carbon.js?serve=${
    placement === 'landing' ? 'CWYI4KJI' : 'CWYI4KJW'
  }&placement=planningpokerlive${ignoreParam}`;
};

@Component({
  selector: 'app-carbon-ad',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './carbon-ad.component.html',
  styleUrls: ['./carbon-ad.component.scss'],
})
export class CarbonAdComponent implements OnInit, OnDestroy {
  @Input({ required: true }) placement!: 'landing' | 'app';
  @Input() isPremiumRoom: boolean = false;

  vm: Observable<ViewModel> = EMPTY;

  isHidden = false;
  loadedScript = false;

  readonly destroy = new Subject<void>();
  constructor(
    private readonly paymentsService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {
    this.vm = combineLatest([
      from(this.paymentsService.isPremiumSubscriber()),
      of(this.config.runningIn),
      of(this.isPremiumRoom),
    ]).pipe(
      map(([isPremium, runningIn, isPremiumRoom]) => {
        return !isPremium && !isPremiumRoom && runningIn === 'web';
      }),
      map((showAds) => {
        return { showAds, carbonSrc: createCarbonSrc(this.placement) };
      })
    );

    this.vm
      .pipe(
        filter((vm) => !!vm.showAds),
        delay(100),
        takeUntil(this.destroy)
      )
      .subscribe((vm) =>
        this.loadScript(vm.carbonSrc).catch((e) =>
          console.error('Failed to load carbon ads script', e)
        )
      );
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  loadScript(scriptSrc: string) {
    return new Promise((resolve, reject) => {
      if (this.loadedScript) {
        // TODO: Remove maybe?
      } else {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = scriptSrc;
        script.id = '_carbonads_js';

        script.onload = () => {
          this.loadedScript = true;
          resolve(true);
        };

        script.onerror = (error: any) => reject(error);

        document.getElementById('ads-container').appendChild(script);
      }
    });
  }

  hideAd() {
    this.analyticsService.logClickedHideAd();
    this.isHidden = true;
  }
}
