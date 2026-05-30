import { Injectable } from '@angular/core';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebase';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  async uploadFile(referencePath: string, file: File): Promise<string> {
    const reference = ref(storage, referencePath);

    await uploadBytes(reference, file);
    const downloadUrl = await getDownloadURL(reference);

    return downloadUrl;
  }
}
