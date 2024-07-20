import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomAppBannerComponent } from './zoom-app-banner.component';

describe('ZoomAppBannerComponent', () => {
  let component: ZoomAppBannerComponent;
  let fixture: ComponentFixture<ZoomAppBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ZoomAppBannerComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomAppBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
