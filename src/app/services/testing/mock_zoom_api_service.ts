import { ZoomApiService } from '../zoom-api.service';

export function createMockZoomApiService() {
  const mockZoomApiService = jasmine.createSpyObj('ZoomApiService', ['']);
  return mockZoomApiService as unknown as jasmine.SpyObj<ZoomApiService>;
}

export const MOCK_ZOOM_API_SERVICE_PROVIDER = [
  {
    provide: ZoomApiService,
    useValue: createMockZoomApiService(),
  },
];
