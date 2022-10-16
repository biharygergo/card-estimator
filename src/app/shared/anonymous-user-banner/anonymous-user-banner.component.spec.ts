import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnonymousUserBannerComponent } from './anonymous-user-banner.component';

describe('AnonymousUserBannerComponent', () => {
  let component: AnonymousUserBannerComponent;
  let fixture: ComponentFixture<AnonymousUserBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnonymousUserBannerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnonymousUserBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
