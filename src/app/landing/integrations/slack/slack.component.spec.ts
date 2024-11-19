import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlackComponent } from './slack.component';

describe('SlackComponent', () => {
  let component: SlackComponent;
  let fixture: ComponentFixture<SlackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
