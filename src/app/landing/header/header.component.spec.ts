import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookieService } from 'src/app/services/cookie.service';
import {
  createMockCookieService,
  MOCK_COOKIE_SERVICE_PROVIDER,
} from 'src/app/services/testing/mock_cookie_service';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      (() => {
        return {
          declarations: [HeaderComponent],
          providers: [MOCK_COOKIE_SERVICE_PROVIDER],
        };
      })()
    ).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should try showing the cookie banner', () => {
    const mockCookieService = TestBed.inject(CookieService);
    expect(mockCookieService.tryShowCookieBanner).toHaveBeenCalledTimes(1);
  });
});
