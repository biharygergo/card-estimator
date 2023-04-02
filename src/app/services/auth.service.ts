import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  linkWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
  user,
} from '@angular/fire/auth';
import {
  EmailAuthProvider,
  linkWithPopup,
  signInAnonymously,
  signInWithPopup,
  unlink,
  updateProfile,
  User,
  UserInfo,
} from 'firebase/auth';
import {
  doc,
  docData,
  DocumentReference,
  FieldValue,
  Firestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  combineLatest,
  EMPTY,
  firstValueFrom,
  map,
  Observable,
  Subject,
  tap,
} from 'rxjs';
import { GoogleAuthProvider } from 'firebase/auth';
import { UserDetails, UserProfile, UserProfileMap } from '../types';
import { SupportedPhotoUrlPipe } from '../shared/supported-photo-url.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import Cookies from 'js-cookie';

export const PROFILES_COLLECTION = 'userProfiles';
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
    if (!user.isAnonymous) {
      await this.updateUserDetails(user.uid, { displayName: name });
    }
    return updateProfile(user, { displayName: name });
  }

  getUser(): Promise<User | null> {
    return firstValueFrom(this.user);
  }

  getUid() {
    return this.auth.currentUser?.uid;
  }

  refreshIdToken() {
    return this.auth.currentUser?.getIdToken(true);
  }

  async getCustomClaims() {
    const token = await this.auth.currentUser?.getIdTokenResult();
    return token?.claims;
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

    await this.handleSignInResult({ isNewUser });
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

    await this.handleSignInResult({ isNewUser: true });
    this.snackbar.open(`Your account is now set up, awesome!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  async signInWithEmailAndPassword(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    const isNewUser = getAdditionalUserInfo(userCredential).isNewUser;

    await this.handleSignInResult({ isNewUser });
    this.snackbar.open(`You are now signed in, welcome back!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  async signUpWithEmailAndPassword(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    await this.handleSignInResult({ isNewUser: true });
    this.snackbar.open(`Your account is now set up, awesome!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  async linkAccountWithEmailAndPassword(email: string, password: string) {
    const credential = EmailAuthProvider.credential(email, password);

    const userCredential = await linkWithCredential(
      this.auth.currentUser,
      credential
    );

    await this.handleSignInResult({ isNewUser: true });
    this.snackbar.open(`Your account is now set up, awesome!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  private async handleSignInResult(options: { isNewUser: boolean }) {
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
    if (!this.auth.currentUser?.isAnonymous) {
      await this.updateUserDetails(this.auth.currentUser.uid, { avatarUrl });
    }
    this.avatarUpdated.next(avatarUrl);
  }

  async createPermanentUser(user: User) {
    const userDetails: UserDetails = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName ?? user.email?.split('@')[0],
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

  setSessionCookie(value: string) {
    Cookies.set('__session', value);
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

  getUserProfile(userId: string): Observable<UserProfile | undefined> {
    return docData<UserProfile | undefined>(
      doc(
        this.firestore,
        `${PROFILES_COLLECTION}/${userId}`
      ) as DocumentReference<UserProfile>
    );
  }

  getUserProfiles(userIds: string[]): Observable<UserProfileMap> {
    const userProfileObservables = userIds.map((userId) =>
      this.getUserProfile(userId).pipe(map((profile) => ({ profile, userId })))
    );
    return combineLatest(userProfileObservables).pipe(
      map((profiles) => {
        return profiles.reduce((acc, curr) => {
          acc[curr.userId] = curr.profile;
          return acc;
        }, {});
      })
    );
  }
}
