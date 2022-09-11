import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomLoadingComponent } from './room-loading.component';

describe('RoomLoadingComponent', () => {
  let component: RoomLoadingComponent;
  let fixture: ComponentFixture<RoomLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomLoadingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
