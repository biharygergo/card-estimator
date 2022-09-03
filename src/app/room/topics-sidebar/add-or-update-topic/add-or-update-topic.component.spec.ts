import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOrUpdateTopicComponent } from './add-or-update-topic.component';

describe('AddOrUpdateTopicComponent', () => {
  let component: AddOrUpdateTopicComponent;
  let fixture: ComponentFixture<AddOrUpdateTopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddOrUpdateTopicComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOrUpdateTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
