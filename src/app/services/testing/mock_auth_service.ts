import { AuthService } from '../auth.service';

export function createMockAuthService() {
  const mockAuthService = jasmine.createSpyObj('AuthService', ['']);
  return mockAuthService as unknown as jasmine.SpyObj<AuthService>;;
}

export const MOCK_AUTH_SERVICE_PROVIDER = [
  {
    provide: AuthService,
    useValue: createMockAuthService(),
  },
];
