import { Inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  linkWithCredential,
  OAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateEmail,
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
  GoogleAuthProvider,
} from '@angular/fire/auth';
import {
  doc,
  docData,
  docSnapshots,
  DocumentReference,
  FieldValue,
  Firestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  catchError,
  combineLatest,
  EMPTY,
  filter,
  firstValueFrom,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  UserDetails,
  UserPreference,
  UserProfile,
  UserProfileMap,
} from '../types';
import { SupportedPhotoUrlPipe } from '../shared/supported-photo-url.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import Cookies from 'js-cookie';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import { jwtDecode, JwtPayload } from 'jwt-decode';

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
  provider: string;
};

function validateIdToken(idToken?: string) {
  if (!idToken) return;

  if (!jwtDecode<JwtPayload & { email?: string }>(idToken).email) {
    throw new Error(
      'This account does not have an email address associated with it. Please select a different account.'
    );
  }
}
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
    private snackbar: MatSnackBar,
    @Inject(APP_CONFIG) public readonly config: AppConfig
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
    await updateProfile(user, { displayName: name });
    await this.refreshIdToken();
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

  getApiAuthUrl(
    authIntent: AuthIntent,
    provider: string,
    returnToPath?: string
  ): string {
    return `${window.origin}/api/startOAuth?intent=${authIntent}${
      returnToPath ? `&returnPath=${encodeURIComponent(returnToPath)}` : ''
    }&platform=${this.config.runningIn}&provider=${provider}`;
  }

  async signInWithMicrosoft(idToken?: string) {
    validateIdToken(idToken);

    const provider = this.createMicrosoftOpenIdProvider();
    const userCredential = idToken
      ? await signInWithCredential(this.auth, provider.credential({ idToken }))
      : await signInWithPopup(this.auth, provider);

    const isNewUser = getAdditionalUserInfo(userCredential).isNewUser;

    await this.handleSignInResult({ isNewUser });
    this.snackbar.open(`You are now signed in, welcome back!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  async linkAccountWithMicrosoft(idToken?: string) {
    validateIdToken(idToken);

    const provider = this.createMicrosoftOpenIdProvider();
    const userCredential = idToken
      ? await linkWithCredential(
          this.auth.currentUser,
          provider.credential({ idToken })
        )
      : await linkWithPopup(this.auth.currentUser, provider);

    await this.handleSignInResult({ isNewUser: true });
    this.snackbar.open(`Your account is now set up, awesome!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
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

  async signUpWithEmailAndPassword(
    email: string,
    password: string,
    displayName: string
  ) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    await this.handleSignInResult({ isNewUser: true, displayName });
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

  private async handleSignInResult(options: {
    isNewUser: boolean;
    displayName?: string;
  }) {
    if (
      new SupportedPhotoUrlPipe().isSupported(
        this.auth.currentUser.photoURL
      ) === false
    ) {
      await updateProfile(this.auth.currentUser, { photoURL: '' });
    }
    if (options.isNewUser) {
      await this.createPermanentUser(
        this.auth.currentUser,
        options.displayName
      );
    }
  }

  private createGoogleProvider() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    return provider;
  }

  private createMicrosoftOpenIdProvider() {
    const provider = new OAuthProvider('oidc.microsoft');
    provider.addScope('openid');
    provider.addScope('profile');
    provider.addScope('email');
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

  async createPermanentUser(user: User, displayName?: string) {
    const userDetails: UserDetails = {
      id: user.uid,
      email: user.email,
      displayName: displayName ?? user.displayName ?? user.email?.split('@')[0],
      avatarUrl: new SupportedPhotoUrlPipe().transform(user.photoURL),
      createdAt: serverTimestamp(),
    };

    if (user.displayName !== userDetails.displayName) {
      await updateProfile(user, { displayName: userDetails.displayName });
      await this.auth.currentUser.reload();
    }

    await setDoc(
      doc(this.firestore, USER_DETAILS_COLLECTION, user.uid),
      userDetails
    );
  }

  async updateUserDetails(userId: string, userDetails: Partial<UserDetails>) {
    await updateDoc(
      doc(this.firestore, USER_DETAILS_COLLECTION, userId),
      userDetails
    ).catch(error => {
      console.error('Error while updating userDetails: ', error);
    });
  }

  async updateCurrentUserEmail(email: string, password: string) {
    const user = await this.getUser();
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password)
    );
    await updateEmail(user, email);
    await this.updateUserDetails(user.uid, { email });
  }

  setSessionCookie(value: string) {
    Cookies.set('__session', value, { secure: true });
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

  updateUserPreference(preference: Partial<UserPreference>) {
    return this.user.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return EMPTY;
        }

        return setDoc(
          doc(this.firestore, `userPreferences/${user.uid}`),
          preference,
          { merge: true }
        );
      })
    );
  }

  getUserPreference(): Observable<UserPreference | undefined> {
    return this.user.pipe(
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }

        return docSnapshots(
          doc(
            this.firestore,
            `userPreferences/${user.uid}`
          ) as DocumentReference<UserPreference>
        ).pipe(
          filter(
            snapshot =>
              !snapshot.metadata.fromCache &&
              !snapshot.metadata.hasPendingWrites
          ),
          map(snapshot => snapshot.data() as UserPreference)
        );
      }),
      catchError(() => {
        return of(undefined);
      })
    );
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
    const userProfileObservables = userIds.map(userId =>
      this.getUserProfile(userId).pipe(map(profile => ({ profile, userId })))
    );
    return combineLatest(userProfileObservables).pipe(
      map(profiles => {
        return profiles.reduce((acc, curr) => {
          acc[curr.userId] = curr.profile;
          return acc;
        }, {});
      })
    );
  }

  sendForgotPasswordEmail(email: string) {
    return sendPasswordResetEmail(this.auth, email, {
      url: `${window.location.origin}/join`,
    });
  }
}
