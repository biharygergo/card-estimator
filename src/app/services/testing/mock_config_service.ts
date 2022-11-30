import { ConfigService } from '../config.service';

export function createMockConfigService() {
  const mockConfigService = jasmine.createSpyObj('ConfigService', ['']);
  return mockConfigService as unknown as jasmine.SpyObj<ConfigService>;;
}

export const MOCK_CONFIG_SERVICE_PROVIDER = [
  {
    provide: ConfigService,
    useValue: createMockConfigService(),
  },
];
