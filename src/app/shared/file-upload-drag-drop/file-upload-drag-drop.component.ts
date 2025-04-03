import { Component, EventEmitter, Output } from '@angular/core';
import {
  FileHandle,
  DragDropDirective,
} from '../directives/drag-drop.directive';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'file-upload-drag-drop',
  templateUrl: './file-upload-drag-drop.component.html',
  styleUrls: ['./file-upload-drag-drop.component.scss'],
  imports: [DragDropDirective, MatIcon],
})
export class FileUploadDragDropComponent {
  @Output() onFileDropped = new EventEmitter<File>();

  files: FileHandle[] = [];

  onFileSelected(event: any) {
    this.onFileDropped.emit(event.target.files[0]);
  }

  fileDropped(files: FileHandle[]): void {
    this.files = files;
    this.onFileDropped.emit(files.pop().file);
  }
}
