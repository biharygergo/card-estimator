import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomControllerPanelComponent } from './room-controller-panel.component';

describe('RoomControllerPanelComponent', () => {
  let component: RoomControllerPanelComponent;
  let fixture: ComponentFixture<RoomControllerPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RoomControllerPanelComponent],
    });
    fixture = TestBed.createComponent(RoomControllerPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
