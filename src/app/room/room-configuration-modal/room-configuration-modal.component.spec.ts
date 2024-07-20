import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomConfigurationModalComponent } from './room-configuration-modal.component';

describe('RoomConfigurationModalComponent', () => {
  let component: RoomConfigurationModalComponent;
  let fixture: ComponentFixture<RoomConfigurationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [RoomConfigurationModalComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(RoomConfigurationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
