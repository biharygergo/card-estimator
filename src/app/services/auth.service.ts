import { Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  linkWithPopup,
  signInAnonymously,
  unlink,
  updateEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { EMPTY, firstValueFrom, Observable, Subject } from 'rxjs';
import { GoogleAuthProvider } from 'firebase/auth';
import { UserDetails, UserProfile } from '../types';

export const PROFILES_COLLECTION = 'profiles';
export const USER_DETAILS_COLLECTION = 'user_details';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public readonly user: Observable<User | null> = EMPTY;

  avatarUpdated = new Subject<string | null>();

  constructor(private auth: Auth, private firestore: Firestore) {
    this.user = user(this.auth);
  }

  async loginAnonymously(displayName?: string) {
    await signInAnonymously(this.auth);
    const user = await this.getUser();
    await updateProfile(user, { displayName });
    return user;
  }

  getUser(): Promise<User | null> {
    return firstValueFrom(this.user);
  }

  async linkAccountWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

    const userCredential = await linkWithPopup(this.auth.currentUser, provider);
    const googleProviderData = userCredential.user.providerData.find(
      (providerData) => providerData.providerId === provider.providerId
    );
    await this.updateAvatar(googleProviderData.photoURL);
    await updateEmail(this.auth.currentUser, googleProviderData.email);
    await this.createPermanentUser(this.auth.currentUser);
  }

  async unlinkGoogleAccount() {
    const provider = new GoogleAuthProvider();
    await unlink(this.auth.currentUser, provider.providerId);
  }

  async updateAvatar(avatarUrl: string | null) {
    await updateProfile(this.auth.currentUser, { photoURL: avatarUrl ?? '' });
    this.avatarUpdated.next(avatarUrl);

    try {
      if (!this.auth.currentUser.isAnonymous) {
        await updateDoc(
          doc(this.firestore, PROFILES_COLLECTION, this.auth.currentUser.uid),
          {
            avatarUrl,
          } as Partial<UserProfile>
        );
      }
    } catch {
      // Silent error, this user is probably deleted
    }
  }

  async createPermanentUser(user: User) {
    await setDoc(doc(this.firestore, PROFILES_COLLECTION, user.uid), {
      id: user.uid,
      displayName: user.displayName,
      avatarUrl: user.photoURL,
    } as UserProfile);
    await setDoc(doc(this.firestore, USER_DETAILS_COLLECTION, user.uid), {
      id: user.uid,
      email: user.email,
    } as UserDetails);
  }
}
