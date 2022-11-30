import { EstimatorService } from '../estimator.service';

export function createMockEstimatorService() {
  const mockEstimatorService = jasmine.createSpyObj('EstimatorService', ['']);
  return mockEstimatorService as unknown as jasmine.SpyObj<EstimatorService>;
}

export const MOCK_ESTIMATOR_SERVICE_PROVIDER = [
  {
    provide: EstimatorService,
    useValue: createMockEstimatorService(),
  },
];
