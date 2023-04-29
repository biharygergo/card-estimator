import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateOrJoinRoomComponent } from './create-or-join-room/create-or-join-room.component';
import { WrapperComponent } from './landing/wrapper/wrapper.component';
import { RoomLoadingComponent } from './room-loading/room-loading.component';
import { SessionHistoryPageComponent } from './session-history-page/session-history-page.component';

const routes: Routes = [
  {
    path: '',
    component: WrapperComponent,
    loadChildren: () => import('./landing/landing.module').then(m => m.LandingModule)

  },
  {
    path: 'join',
    loadComponent: () => import('./create-or-join-room/create-or-join-room.component').then(m => m.CreateOrJoinRoomComponent),
    data: { title: 'Join' },
  },
  {
    path: 'create',
    loadComponent: () => import('./create-or-join-room/create-or-join-room.component').then(m => m.CreateOrJoinRoomComponent),
    data: { title: 'Create Room' },
  },
  {
    path: 'history',
    loadComponent: () => import('./session-history-page/session-history-page.component').then(m => m.SessionHistoryPageComponent),
    data: { title: 'Session history' },
  },
  {
    path: 'room',
    component: RoomLoadingComponent,
    data: { title: 'Loading room' },
    loadChildren: () => import('./room/room.module').then(m => m.RoomModule)
  },
  {
    path: 'recurringMeeting/:linkId',
    loadComponent: () => import('./recurring-meeting/recurring-meeting.component').then(m => m.RecurringMeetingComponent),
    data: { title: 'Recurring meeting lobby' },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking',
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled'
}),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
