import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomAuthenticationModalComponent } from './room-authentication-modal.component';

describe('RoomAuthenticationModalComponent', () => {
  let component: RoomAuthenticationModalComponent;
  let fixture: ComponentFixture<RoomAuthenticationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [RoomAuthenticationModalComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(RoomAuthenticationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
