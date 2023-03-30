import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RichTopic } from 'src/app/types';

@Component({
  selector: 'app-rich-topic',
  templateUrl: './rich-topic.component.html',
  styleUrls: ['./rich-topic.component.scss'],
})
export class RichTopicComponent {
  @Input() richTopic: RichTopic | null | undefined;
  @Input() enableEditing: boolean = false;

  @Output() deleted = new EventEmitter();

  openRemoteTopic() {
    if (this.richTopic) {
      window.open(this.richTopic.url, '_blank');
    }
  }
}
