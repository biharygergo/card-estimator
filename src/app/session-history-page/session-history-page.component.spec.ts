import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionHistoryPageComponent } from './session-history-page.component';

describe('SessionHistoryPageComponent', () => {
  let component: SessionHistoryPageComponent;
  let fixture: ComponentFixture<SessionHistoryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SessionHistoryPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionHistoryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
