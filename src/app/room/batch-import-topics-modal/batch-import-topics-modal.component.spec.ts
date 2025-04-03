import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchImportTopicsModalComponent } from './batch-import-topics-modal.component';

describe('BatchImportTopicsModalComponent', () => {
  let component: BatchImportTopicsModalComponent;
  let fixture: ComponentFixture<BatchImportTopicsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchImportTopicsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchImportTopicsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
