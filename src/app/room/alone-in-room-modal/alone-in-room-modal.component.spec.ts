import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AloneInRoomModalComponent } from './alone-in-room-modal.component';

describe('AloneInRoomModalComponent', () => {
  let component: AloneInRoomModalComponent;
  let fixture: ComponentFixture<AloneInRoomModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AloneInRoomModalComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AloneInRoomModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
