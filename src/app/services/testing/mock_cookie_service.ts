import { MatSnackBar } from '@angular/material/snack-bar';
import { CookieService } from '../cookie.service';

export class MockCookieService extends CookieService {
  constructor() {
    super(jasmine.anything() as unknown as MatSnackBar);
  }
  showCookieBanner = false;
  tryShowCookieBanner = jasmine.createSpy();
}

export function createMockCookieService() {
  return new MockCookieService();
}

export const MOCK_COOKIE_SERVICE_PROVIDER = [
  {
    provide: CookieService,
    useValue: createMockCookieService(),
  },
];
