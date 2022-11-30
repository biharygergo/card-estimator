import { SerializerService } from '../serializer.service';

export function createMockSerializerService() {
  const mockSerializerService = jasmine.createSpyObj('SerializerService', ['']);
  return mockSerializerService as unknown as jasmine.SpyObj<SerializerService>;
}

export const MOCK_SERIALIZER_SERVICE_PROVIDER = [
  {
    provide: SerializerService,
    useValue: createMockSerializerService(),
  },
];
