import { Analytics } from '@angular/fire/analytics';
import { AnalyticsService } from '../analytics.service';

export class MockAnalyticsService extends AnalyticsService {
  constructor() {
    super(jasmine.anything() as unknown as Analytics);
  }
}

export function createMockAnalyticsService() {
  return new MockAnalyticsService();
}

export const MOCK_ANALYTICS_SERVICE_PROVIDER = [
  {
    provide: AnalyticsService,
    useValue: createMockAnalyticsService(),
  },
];
