import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomTemplatesModalComponent } from './room-templates-modal.component';

describe('RoomTemplatesModalComponent', () => {
  let component: RoomTemplatesModalComponent;
  let fixture: ComponentFixture<RoomTemplatesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomTemplatesModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomTemplatesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
