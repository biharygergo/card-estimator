import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateOrJoinRoomComponent } from './create-or-join-room.component';

describe('CreateOrJoinRoomComponent', () => {
  let component: CreateOrJoinRoomComponent;
  let fixture: ComponentFixture<CreateOrJoinRoomComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [CreateOrJoinRoomComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateOrJoinRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
