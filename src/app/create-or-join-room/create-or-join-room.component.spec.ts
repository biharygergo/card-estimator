import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOrJoinRoomComponent } from './create-or-join-room.component';

describe('CreateOrJoinRoomComponent', () => {
  let component: CreateOrJoinRoomComponent;
  let fixture: ComponentFixture<CreateOrJoinRoomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateOrJoinRoomComponent ]
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
