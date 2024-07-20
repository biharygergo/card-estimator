import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionHistoryComponent } from './session-history.component';

describe('SessionHistoryComponent', () => {
  let component: SessionHistoryComponent;
  let fixture: ComponentFixture<SessionHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SessionHistoryComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
