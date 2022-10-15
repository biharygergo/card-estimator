import { Injectable } from '@angular/core';
import { Auth, getAdditionalUserInfo, user } from '@angular/fire/auth';
import {
  linkWithPopup,
  signInAnonymously,
  signInWithPopup,
  unlink,
  updateEmail,
  updateProfile,
  User,
  UserInfo,
} from 'firebase/auth';
import { doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { EMPTY, firstValueFrom, Observable, startWith, Subject, tap } from 'rxjs';
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
    this.user = user(this.auth).pipe(tap(user => console.log(user)));
  }

  async loginAnonymously(displayName?: string) {
    await signInAnonymously(this.auth);
    const user = await this.getUser();
    await this.updateDisplayName(user, displayName);
    return user;
  }

  updateDisplayName(user: User, name: string): Promise<void> {
    return updateProfile(user, { displayName: name });
  }

  getUser(): Promise<User | null> {
    return firstValueFrom(this.user);
  }

  getUid() {
    return this.auth.currentUser?.uid;
  }

  signOut() {
    this.auth.signOut();
  }

  async signInWithGoogle() {
    const provider = this.createGoogleProvider();
    const userCredential = await signInWithPopup(this.auth, provider)

    const isNewUser = getAdditionalUserInfo(userCredential).isNewUser;

    const googleProviderData = userCredential.user.providerData.find(
      (providerData) => providerData.providerId === provider.providerId
    );
    await this.handleSignInResult(googleProviderData, {isNewUser});
  }

  async linkAccountWithGoogle() {
    const provider = this.createGoogleProvider();

    const userCredential = await linkWithPopup(this.auth.currentUser, provider);
    const googleProviderData = userCredential.user.providerData.find(
      (providerData) => providerData.providerId === provider.providerId
    );
    await this.handleSignInResult(googleProviderData, {isNewUser: true});
  }

  private async handleSignInResult(providerData: UserInfo, options: {isNewUser: boolean}) {
    await this.updateAvatar(providerData.photoURL);
    await updateEmail(this.auth.currentUser, providerData.email);
    if (options.isNewUser) {
      await this.createPermanentUser(this.auth.currentUser);
    }
  }

  private createGoogleProvider() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    return provider;
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
