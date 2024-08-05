import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetComponent } from './meet.component';

describe('MeetComponent', () => {
  let component: MeetComponent;
  let fixture: ComponentFixture<MeetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
