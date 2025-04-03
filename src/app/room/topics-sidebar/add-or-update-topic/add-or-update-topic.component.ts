import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { BehaviorSubject, Subject } from 'rxjs';
import {
  TopicEditorInputOutput,
  TopicEditorComponent,
} from '../../topic-editor/topic-editor.component';
import { MatCard, MatCardContent } from '@angular/material/card';

@Component({
  selector: 'add-or-update-topic',
  templateUrl: './add-or-update-topic.component.html',
  styleUrls: ['./add-or-update-topic.component.scss'],
  imports: [MatCard, MatCardContent, TopicEditorComponent],
})
export class AddOrUpdateTopicComponent implements OnInit, OnChanges {
  @Input() roundNumber!: number;
  @Input() topicInput: TopicEditorInputOutput;
  @Output() onSaveOrUpdate = new EventEmitter<TopicEditorInputOutput>();
  @Output() onCancel = new EventEmitter<void>();

  topicInput$ = new BehaviorSubject<TopicEditorInputOutput>({ topic: '' });

  constructor() {}

  ngOnInit(): void {
    this.topicInput$.next(this.topicInput);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['topicInput']) {
      this.topicInput$.next(
        changes['topicInput'].currentValue as TopicEditorInputOutput
      );
    }
  }
}
