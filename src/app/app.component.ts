import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable, Subject, takeUntil } from 'rxjs';
import { NavigationService } from './services/navigation.service';
import { subscriptionResultModalCreator } from './shared/subscription-result/subscription-result.component';
import { SubscriptionResult } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptionResult$: Observable<SubscriptionResult> =
    this.activatedRoute.queryParamMap.pipe(
      map(
        (params) =>
          params.get('subscriptionResult') as SubscriptionResult | null
      ),
      filter((result) => !!result)
    );

  onTitleUpdated$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => {
      let route: ActivatedRoute = this.router.routerState.root;
      let routeTitle = '';
      while (route!.firstChild) {
        route = route.firstChild;
      }
      if (route.snapshot.data['title']) {
        routeTitle = route!.snapshot.data['title'];
      }
      return {
        routeTitle,
        disablePostfix: route?.snapshot?.data['disablePostfix'],
      };
    })
  );

  private readonly destroyed = new Subject<void>();

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private readonly navigationService: NavigationService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit() {
    this.onTitleUpdated$
      .pipe(takeUntil(this.destroyed))
      .subscribe(({ routeTitle, disablePostfix }) => {
        if (routeTitle) {
          this.titleService.setTitle(
            `${routeTitle}${disablePostfix ? '' : ' - Planning Poker'}`
          );
        }
      });

    this.subscriptionResult$
      .pipe(takeUntil(this.destroyed))
      .subscribe((result) => {
        this.dialog.open(...subscriptionResultModalCreator({ result }));
      });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
