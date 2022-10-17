import { SupportedPhotoUrlPipe } from './supported-photo-url.pipe';

describe('SupportedPhotoUrlPipe', () => {
  it('create an instance', () => {
    const pipe = new SupportedPhotoUrlPipe();
    expect(pipe).toBeTruthy();
  });
});
