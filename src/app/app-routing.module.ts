import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WrapperComponent } from './landing/wrapper/wrapper.component';
import { RoomLoadingComponent } from './room-loading/room-loading.component';

const routes: Routes = [
  {
    path: '',
    component: WrapperComponent,
    loadChildren: () =>
      import('./landing/landing.module').then((m) => m.LandingModule),
  },
  {
    path: 'join',
    loadComponent: () =>
      import('./create-or-join-room/create-or-join-room.component').then(
        (m) => m.CreateOrJoinRoomComponent
      ),
    data: {
      title: 'Join',
      description:
        'Join an existing room and estimate issues on PlanningPoker.live',
      supportsTheme: true,
      noIndex: true,
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-or-join-room/create-or-join-room.component').then(
        (m) => m.CreateOrJoinRoomComponent
      ),
    data: {
      title: 'Create Room',
      description:
        'Create a new room and estimate issues on PlanningPoker.live',
      supportsTheme: true,
      noIndex: true,
    },
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./session-history-page/session-history-page.component').then(
        (m) => m.SessionHistoryPageComponent
      ),
    data: {
      title: 'Session history',
      description: 'Browser your previous sessions on PlanningPoker.live',
      supportsTheme: true,
      noIndex: true,
    },
  },
  {
    path: 'room',
    component: RoomLoadingComponent,
    data: { title: 'Loading room', supportsTheme: true, noIndex: true },
    loadChildren: () => import('./room/room.module').then((m) => m.RoomModule),
  },
  {
    path: 'recurringMeeting/:linkId',
    loadComponent: () =>
      import('./recurring-meeting/recurring-meeting.component').then(
        (m) => m.RecurringMeetingComponent
      ),
    data: {
      title: 'Recurring meeting lobby',
      supportsTheme: true,
      noIndex: true,
    },
  },
  {
    path: 'integrations/teams/configure',
    loadComponent: () =>
      import('./integrations/teams/configure-tab/configure-tab.component').then(
        (mod) => mod.ConfigureTabComponent
      ),
    data: { title: 'Configure Teams', supportsTheme: true, noIndex: true },
  },
  {
    path: 'integrations/teams/auth',
    loadComponent: () =>
      import('./integrations/teams/auth/auth.component').then(
        (mod) => mod.AuthComponent
      ),
    data: { title: 'Authenticate', supportsTheme: true, noIndex: true },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./landing/not-found/not-found.component').then(
        (mod) => mod.NotFoundComponent
      ),
    data: { title: 'Page not found', supportsTheme: false, noIndex: true },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      enableViewTransitions: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
