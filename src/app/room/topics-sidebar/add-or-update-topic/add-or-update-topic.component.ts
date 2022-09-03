import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'add-or-update-topic',
  templateUrl: './add-or-update-topic.component.html',
  styleUrls: ['./add-or-update-topic.component.scss']
})
export class AddOrUpdateTopicComponent implements OnInit {
  @Input() roundNumber!: number;
  @Input() topicName?: string;
  @Output() onSaveOrUpdate = new EventEmitter<string>();
  @Output() onCancel = new EventEmitter<void>();

  topicNameFormControl = new FormControl('');

  constructor() { }

  ngOnInit(): void {
    if (this.topicName) {
      this.topicNameFormControl.setValue(this.topicName);
    }
  }

}
