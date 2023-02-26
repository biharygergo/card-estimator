import { Injectable } from '@angular/core';
import {
  FullMetadata,
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  constructor(private readonly storageService: Storage) {}

  async uploadFile(
    referencePath: string,
    file: File,
  ): Promise<string> {
    const reference = ref(this.storageService, referencePath);

    const snapshot = await uploadBytes(reference, file);
    const downloadUrl = await getDownloadURL(reference);

    return downloadUrl;
  }
}
