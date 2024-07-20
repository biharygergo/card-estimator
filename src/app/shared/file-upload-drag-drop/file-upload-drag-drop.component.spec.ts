import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadDragDropComponent } from './file-upload-drag-drop.component';

describe('FileUploadDragDropComponent', () => {
  let component: FileUploadDragDropComponent;
  let fixture: ComponentFixture<FileUploadDragDropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [FileUploadDragDropComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(FileUploadDragDropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
