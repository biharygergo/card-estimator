import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchAddTopicsModalComponent } from './batch-add-topics-modal.component';

describe('BatchAddTopicsModalComponent', () => {
  let component: BatchAddTopicsModalComponent;
  let fixture: ComponentFixture<BatchAddTopicsModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BatchAddTopicsModalComponent]
    });
    fixture = TestBed.createComponent(BatchAddTopicsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
