import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateOrJoinRoomComponent } from './create-or-join-room/create-or-join-room.component';
import { AboutComponent } from './landing/about/about.component';
import { FaqComponent } from './landing/faq/faq.component';
import { FeaturesComponent } from './landing/features/features.component';
import { LandingComponent } from './landing/landing.component';
import { RoomComponent } from './room/room.component';

const routes: Routes = [
  { path: '', component: LandingComponent, data: { title: 'Home' } },
  {
    path: 'features',
    component: FeaturesComponent,
    data: { title: 'Features' },
  },
  { path: 'faq', component: FaqComponent, data: { title: 'FAQ' } },
  { path: 'about', component: AboutComponent, data: { title: 'About' } },
  {
    path: 'join',
    component: CreateOrJoinRoomComponent,
    data: { title: 'Join' },
  },
  { path: ':roomId', component: RoomComponent, data: { title: 'Active room' } },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      relativeLinkResolution: 'legacy',
      initialNavigation: 'enabledBlocking',
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
