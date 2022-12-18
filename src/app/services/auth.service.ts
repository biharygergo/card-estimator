import { Injectable } from '@angular/core';
import {
  Auth,
  getAdditionalUserInfo,
  linkWithCredential,
  signInWithCredential,
  user,
} from '@angular/fire/auth';
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
import {
  doc,
  FieldValue,
  Firestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { EMPTY, firstValueFrom, Observable, Subject } from 'rxjs';
import { GoogleAuthProvider } from 'firebase/auth';
import { UserDetails, UserProfile } from '../types';
import { SupportedPhotoUrlPipe } from '../shared/supported-photo-url.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import Cookies from 'js-cookie';

export const PROFILES_COLLECTION = 'profiles';
export const USER_DETAILS_COLLECTION = 'userDetails';

// TODO(biharygergo): This is duplicated between /functions
export enum AuthIntent {
  SIGN_IN = 'signIn',
  LINK_ACCOUNT = 'linkAccount',
}

// TODO(biharygergo): This is duplicated between /functions
export type ParsedSessionCookie = {
  authIntent?: AuthIntent;
  returnToPath?: string;
  idToken: string;
  createdAt: FieldValue;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public readonly user: Observable<User | null> = EMPTY;

  avatarUpdated = new Subject<string | null>();
  nameUpdated = new Subject<string>();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private snackbar: MatSnackBar
  ) {
    this.user = user(this.auth).pipe();
  }

  async loginAnonymously(displayName?: string) {
    await signInAnonymously(this.auth);
    const user = await this.getUser();
    await this.updateDisplayName(user, displayName);
    return user;
  }

  async updateDisplayName(user: User, name: string): Promise<void> {
    this.nameUpdated.next(name);
    await this.updateUserDetails(user.uid, { displayName: name });
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

  getApiAuthUrl(authIntent: AuthIntent, returnToPath?: string): string {
    return `${window.origin}/api/startGoogleAuth?intent=${authIntent}${
      returnToPath ? `&returnPath=${encodeURIComponent(returnToPath)}` : ''
    }`;
  }

  async signInWithGoogle(idToken?: string) {
    const provider = this.createGoogleProvider();
    const userCredential = idToken
      ? await signInWithCredential(
          this.auth,
          GoogleAuthProvider.credential(idToken)
        )
      : await signInWithPopup(this.auth, provider);

    const isNewUser = getAdditionalUserInfo(userCredential).isNewUser;

    const googleProviderData = userCredential.user.providerData.find(
      (providerData) => providerData.providerId === provider.providerId
    );
    await this.handleSignInResult(googleProviderData, { isNewUser });
    this.snackbar.open(`You are now signed in, welcome back!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  async linkAccountWithGoogle(idToken?: string) {
    const provider = this.createGoogleProvider();

    const userCredential = idToken
      ? await linkWithCredential(
          this.auth.currentUser,
          GoogleAuthProvider.credential(idToken)
        )
      : await linkWithPopup(this.auth.currentUser, provider);

    const googleProviderData = userCredential.user.providerData.find(
      (providerData) => providerData.providerId === provider.providerId
    );
    await this.handleSignInResult(googleProviderData, { isNewUser: true });
    this.snackbar.open(`Your account is now set up, awesome!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  private async handleSignInResult(
    providerData: UserInfo,
    options: { isNewUser: boolean }
  ) {
    if (
      new SupportedPhotoUrlPipe().isSupported(
        this.auth.currentUser.photoURL
      ) === false
    ) {
      await updateProfile(this.auth.currentUser, { photoURL: '' });
    }
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
    await this.updateUserDetails(this.auth.currentUser.uid, { avatarUrl });
    this.avatarUpdated.next(avatarUrl);
  }

  async createPermanentUser(user: User) {
    const userDetails: UserDetails = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: new SupportedPhotoUrlPipe().transform(user.photoURL),
      createdAt: serverTimestamp(),
    };
    await setDoc(
      doc(this.firestore, USER_DETAILS_COLLECTION, user.uid),
      userDetails
    );
  }

  async updateUserDetails(userId: string, userDetails: Partial<UserDetails>) {
    await updateDoc(
      doc(this.firestore, USER_DETAILS_COLLECTION, userId),
      userDetails
    ).catch((error) => {
      console.error('Error while updating userDetails: ', error);
    });
  }

  getSessionCookie(): string | ParsedSessionCookie | undefined {
    const cookie = Cookies.get('__session');
    if (!cookie) return undefined;

    try {
      const parsedCookie = JSON.parse(cookie) as Partial<ParsedSessionCookie>;
      if (!parsedCookie.idToken || !parsedCookie.createdAt) {
        // Unknown cookie format
        return undefined;
      }
      return parsedCookie as ParsedSessionCookie;
    } catch {
      return cookie;
    }
  }

  clearSessionCookie() {
    Cookies.remove('__session');
  }
}
