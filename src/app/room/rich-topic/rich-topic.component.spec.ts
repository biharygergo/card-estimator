import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RichTopicComponent } from './rich-topic.component';

describe('RichTopicComponent', () => {
  let component: RichTopicComponent;
  let fixture: ComponentFixture<RichTopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RichTopicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RichTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
