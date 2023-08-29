import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';
import { RoomComponent } from './room.component';
import { RoomResolver } from './room.resolver';
import { AddCardDeckModalComponent } from './add-card-deck-modal/add-card-deck-modal.component';
import { AloneInRoomModalComponent } from './alone-in-room-modal/alone-in-room-modal.component';
import { CardDeckComponent } from './card-deck/card-deck.component';
import { CountdownTimerComponent } from './countdown-timer/countdown-timer.component';
import { GithubBadgeComponent } from './github-badge/github-badge.component';
import { NotesFieldComponent } from './notes-field/notes-field.component';
import { AddOrUpdateTopicComponent } from './topics-sidebar/add-or-update-topic/add-or-update-topic.component';
import { TopicsSidebarComponent } from './topics-sidebar/topics-sidebar.component';
import { VelocityComponent } from './velocity/velocity.component';
import { SharedModule } from '../shared/shared.module';
import { RoomConfigurationModalComponent } from './room-configuration-modal/room-configuration-modal.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TopicEditorComponent } from './topic-editor/topic-editor.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MarkdownModule } from 'ngx-markdown';
import { RichTopicComponent } from './rich-topic/rich-topic.component';
import { SummaryModalComponent } from './summary-modal/summary-modal.component';
import { BatchAddTopicsModalComponent } from './batch-add-topics-modal/batch-add-topics-modal.component';

const routes: Routes = [
  {
    path: ':roomId',
    component: RoomComponent,
    resolve: {
      room: RoomResolver,
    },
    data: { title: 'Active room', supportsTheme: true },
  },
];

@NgModule({
  declarations: [
    RoomComponent,
    AloneInRoomModalComponent,
    GithubBadgeComponent,
    NotesFieldComponent,
    AddCardDeckModalComponent,
    CardDeckComponent,
    TopicsSidebarComponent,
    AddOrUpdateTopicComponent,
    CountdownTimerComponent,
    VelocityComponent,
    RoomConfigurationModalComponent,
    TopicEditorComponent,
    RichTopicComponent,
    SummaryModalComponent,
    BatchAddTopicsModalComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MarkdownModule.forRoot(),
    RouterModule.forChild(routes),
  ],
})
export class RoomModule {}
