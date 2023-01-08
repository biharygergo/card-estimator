import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, ActivatedRoute, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NavigationService } from './services/navigation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'estimator';
  constructor(
    private router: Router,
    private titleService: Title,
    private readonly navigationService: NavigationService,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
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
      )
      .subscribe(({ routeTitle, disablePostfix }) => {
        if (routeTitle) {
          this.titleService.setTitle(
            `${routeTitle}${disablePostfix ? '' : ' - Planning Poker'}`
          );
        }
      });
  }
}
