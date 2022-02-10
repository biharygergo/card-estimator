import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateOrJoinRoomComponent } from './create-or-join-room/create-or-join-room.component';
import { LandingComponent } from './landing/landing.component';
import { RoomComponent } from './room/room.component';

const routes: Routes = [
  { path: '', component: LandingComponent},
  { path: 'join', component: CreateOrJoinRoomComponent },
  { path: ':roomId', component: RoomComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy', initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
