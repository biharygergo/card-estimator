import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'supportedPhotoUrl',
})
export class SupportedPhotoUrlPipe implements PipeTransform {
  supportedAvatarDomains = ['dicebear.com'];

  isSupported(photoUrl?: string) {
    if (!photoUrl) {
      return true;
    }

    return this.supportedAvatarDomains.some((supportedDomain) =>
      photoUrl.includes(supportedDomain)
    );
  }

  transform(photoUrl: string | null | undefined): string | null {
    if (!photoUrl) {
      return null;
    }
    return this.isSupported(photoUrl) ? photoUrl : null;
  }
}
