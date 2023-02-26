import { Component, EventEmitter, Output } from '@angular/core';
import { FileHandle } from '../directives/drag-drop.directive';

@Component({
  selector: 'file-upload-drag-drop',
  templateUrl: './file-upload-drag-drop.component.html',
  styleUrls: ['./file-upload-drag-drop.component.scss'],
})
export class FileUploadDragDropComponent {
  @Output() onFileDropped = new EventEmitter<File>();

  files: FileHandle[] = [];

  onFileSelected(event: any) {
    this.onFileDropped.emit(event.target.files[0]);
  }

  fileDropped(files: FileHandle[]): void {
    console.log('Got file in component...');
    this.files = files;
    this.onFileDropped.emit(files.pop().file);
  }
}
