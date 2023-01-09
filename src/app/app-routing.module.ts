import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateOrJoinRoomComponent } from './create-or-join-room/create-or-join-room.component';
import { FaqComponent } from './landing/faq/faq.component';
import { FeaturesComponent } from './landing/features/features.component';
import { HomeComponent } from './landing/home/home.component';
import { LandingComponent } from './landing/landing.component';
import { PrivacyComponent } from './landing/privacy/privacy.component';
import { TermsComponent } from './landing/terms/terms.component';
import { WrapperComponent } from './landing/wrapper/wrapper.component';
import { ZoomComponent } from './landing/zoom/zoom.component';
import { RoomLoadingComponent } from './room-loading/room-loading.component';
import { SessionHistoryPageComponent } from './session-history-page/session-history-page.component';

const routes: Routes = [
  {
    path: '',
    component: WrapperComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        data: {
          title: 'Planning Poker - Made for Remote Teams - SCRUM Poker',
          disablePostfix: true,
        },
      },
      {
        path: 'features',
        component: FeaturesComponent,
        data: { title: 'Features' },
      },
      { path: 'faq', component: FaqComponent, data: { title: 'FAQ' } },
      {
        path: 'privacy',
        component: PrivacyComponent,
        data: { title: 'Privacy Policy' },
      },
      {
        path: 'terms',
        component: TermsComponent,
        data: { title: 'Terms and Conditions' },
      },
      {
        path: 'zoom',
        component: ZoomComponent,
        data: { title: 'Zoom Integration' },
      },
    ],
  },
  {
    path: 'join',
    component: CreateOrJoinRoomComponent,
    data: { title: 'Join' },
  },
  {
    path: 'create',
    component: CreateOrJoinRoomComponent,
    data: { title: 'Create Room' },
  },
  {
    path: 'history',
    component: SessionHistoryPageComponent,
    data: { title: 'Session history' },
  },
  {
    path: 'room',
    component: RoomLoadingComponent,
    data: { title: 'Loading room' },
    loadChildren: () => import('./room/room.module').then(m => m.RoomModule)
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
