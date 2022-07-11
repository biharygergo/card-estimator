import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarSelectorModalComponent } from './avatar-selector-modal.component';

describe('AvatarSelectorModalComponent', () => {
  let component: AvatarSelectorModalComponent;
  let fixture: ComponentFixture<AvatarSelectorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AvatarSelectorModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AvatarSelectorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
