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
  signInWithCustomToken,
  signInWithPopup,
  unlink,
  updateProfile,
  User,
  UserInfo,
  GoogleAuthProvider,
} from '@angular/fire/auth';
import {
  collection,
  deleteDoc,
  doc,
  docData,
  docSnapshots,
  DocumentReference,
  FieldValue,
  Firestore,
  query,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  collectionSnapshots,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
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
  RoomTemplate,
  SlotId,
  UserDetails,
  UserPreference,
  UserProfile,
  UserProfileMap,
  SsoDomainConfig,
} from '../types';
import { SupportedPhotoUrlPipe } from '../shared/supported-photo-url.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import Cookies from 'js-cookie';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import {
  SAMLAuthProvider,
} from 'firebase/auth';

export const SSO_DOMAINS_COLLECTION = 'ssoDomains';

export const PROFILES_COLLECTION = 'userProfiles';
export const USER_DETAILS_COLLECTION = 'userDetails';

const AUTH_PROVIDER_LABELS: Record<string, string> = {
  'google.com': 'Google',
  'microsoft.com': 'Microsoft',
  'facebook.com': 'Facebook',
  'twitter.com': 'Twitter / X',
  'github.com': 'GitHub',
  'apple.com': 'Apple',
  password: 'Email & password',
  phone: 'Phone',
};

/** User-facing label for a Firebase `UserInfo.providerId`. */
export function authProviderIdToLabel(providerId: string): string {
  if (providerId.startsWith('saml.')) {
    return 'Work SSO';
  }
  return AUTH_PROVIDER_LABELS[providerId] ?? providerId;
}

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
    private functions: Functions,
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

  getDeviceAuthUrl(authIntent: AuthIntent, provider: string): string {
    return `${window.origin}/api/startDeviceAuth?intent=${authIntent}&provider=${provider}`;
  }

  async redeemDeviceCode(
    code: string
  ): Promise<{ idToken: string; provider: string; authIntent: string }> {
    const response = await fetch(`${window.origin}/api/redeemDeviceCode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || 'Failed to redeem code. Please try again.'
      );
    }

    return response.json();
  }

  async createSsoLinkPairing(): Promise<{
    pairingId: string;
    userCode: string;
    deviceSecret: string;
    expiresInMinutes: number;
  }> {
    const response = await fetch(`${window.origin}/api/createSsoLinkPairing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || 'Could not start SSO link session. Try again.'
      );
    }
    return response.json();
  }

  /**
   * Poll from embedded app after user completes SSO in the browser.
   * Returns customToken only when the browser session called completeSsoLinkPairing.
   */
  async redeemSsoLinkPairing(
    pairingId: string,
    deviceSecret: string
  ): Promise<{ customToken: string }> {
    const response = await fetch(`${window.origin}/api/redeemSsoLinkPairing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairingId, deviceSecret }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const msg =
        typeof body?.error === 'string'
          ? body.error
          : 'Pairing not ready';
      const err = new Error(msg) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }
    return body as { customToken: string };
  }

  async completeSsoLinkPairingInBrowser(pairingId: string): Promise<void> {
    const fn = httpsCallable(this.functions, 'completeSsoLinkPairing');
    await fn({ pairingId });
  }

  async signInWithCustomTokenFromPairing(customToken: string): Promise<void> {
    const cred = await signInWithCustomToken(this.auth, customToken);
    const isNewUser = getAdditionalUserInfo(cred).isNewUser ?? false;
    await this.handleSignInResult({ isNewUser });
    this.snackbar.open(`You are now signed in, welcome back!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
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

  private createEnterpriseSsoProvider(providerId: string) {
    if (providerId.startsWith('saml.')) {
      return new SAMLAuthProvider(providerId);
    }
    const p = new OAuthProvider(providerId);
    p.addScope('openid');
    p.addScope('profile');
    p.addScope('email');
    return p;
  }

  async getSsoDomainConfig(domain: string): Promise<SsoDomainConfig | null> {
    const normalized = domain.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    const snap = await getDoc(
      doc(this.firestore, SSO_DOMAINS_COLLECTION, normalized)
    );
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as SsoDomainConfig;
  }

  async ensureJoinedEnterpriseOrganization(
    organizationId: string | undefined
  ): Promise<void> {
    if (!organizationId) {
      return;
    }
    const u = await this.getUser();
    if (!u) {
      return;
    }
    try {
      const joinFn = httpsCallable(
        this.functions,
        'joinOrganizationIfSsoEligible'
      );
      await joinFn({ organizationId });
    } catch (e) {
      console.warn('joinOrganizationIfSsoEligible', e);
    }
  }

  /**
   * Link enterprise SAML/OIDC to the current account (browser popup).
   * Use in web profile or embed handoff page after signing in with email/Google/Microsoft.
   */
  async linkEnterpriseSso(
    providerId: string,
    organizationId?: string
  ): Promise<void> {
    const current = this.auth.currentUser;
    if (!current || current.isAnonymous) {
      throw new Error('You must be signed in to link work SSO.');
    }
    const authProvider = this.createEnterpriseSsoProvider(providerId);
    await linkWithPopup(current, authProvider);
    await current.reload();
    await this.handleSignInResult({ isNewUser: false });
    await this.ensureJoinedEnterpriseOrganization(organizationId);
    this.snackbar.open(`Work SSO linked to your account.`, null, {
      duration: 4000,
      horizontalPosition: 'right',
    });
  }

  /**
   * Enterprise SSO via Identity Platform (project-level SAML or OIDC provider id).
   * For existing accounts, prefer linkEnterpriseSso from Profile instead.
   */
  async signInWithEnterpriseSso(
    providerId: string,
    organizationId?: string
  ): Promise<void> {
    const authProvider = this.createEnterpriseSsoProvider(providerId);
    const userCredential = await signInWithPopup(this.auth, authProvider);
    const isNewUser = getAdditionalUserInfo(userCredential).isNewUser ?? false;
    await this.handleSignInResult({ isNewUser });
    await this.ensureJoinedEnterpriseOrganization(organizationId);
    this.snackbar.open(`You are now signed in, welcome back!`, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  /**
   * True when the user has more than one linked provider so unlinking is allowed.
   */
  canUnlinkProvider(user: User | null | undefined): boolean {
    if (!user || user.isAnonymous) {
      return false;
    }
    return (user.providerData?.length ?? 0) > 1;
  }

  /**
   * Unlink a Firebase Auth provider from the current user.
   * Requires at least one other sign-in method to remain.
   */
  async unlinkProvider(providerId: string): Promise<void> {
    const u = this.auth.currentUser;
    if (!u) {
      throw new Error('You are not signed in.');
    }
    if (u.isAnonymous) {
      throw new Error('Anonymous users cannot manage linked sign-in methods.');
    }
    if ((u.providerData?.length ?? 0) <= 1) {
      throw new Error(
        'You must keep at least one sign-in method on your account.'
      );
    }
    if (!u.providerData.some(p => p.providerId === providerId)) {
      throw new Error('This sign-in method is not linked to your account.');
    }
    await unlink(u, providerId);
    await u.reload();
    await this.refreshIdToken();
  }

  async unlinkGoogleAccount() {
    await this.unlinkProvider(GoogleAuthProvider.PROVIDER_ID);
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

    // Check for referral code from cookie or localStorage
    const referralCode = this.getReferralCode();
    if (referralCode) {
      userDetails.referredByCode = referralCode;
      console.log('User signed up with referral code:', referralCode);
    }

    if (user.displayName !== userDetails.displayName) {
      await updateProfile(user, { displayName: userDetails.displayName });
      await this.auth.currentUser.reload();
    }

    await setDoc(
      doc(this.firestore, USER_DETAILS_COLLECTION, user.uid),
      userDetails
    );
  }

  private getReferralCode(): string | null {
    // Try to get from cookie first
    const cookieValue = Cookies.get('pp_referral');
    if (cookieValue) {
      return cookieValue;
    }

    // Fallback to localStorage
    try {
      return localStorage.getItem('pp_referral');
    } catch (e) {
      console.error('Error reading referral from localStorage:', e);
      return null;
    }
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

  createId() {
    return doc(collection(this.firestore, '_')).id;
  }

  setRoomTemplate(slotId: SlotId, roomTemplate: RoomTemplate) {
    return this.user.pipe(
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }
        return setDoc(
          doc(
            this.firestore,
            `userDetails/${user.uid}/roomTemplates/${slotId}`
          ),
          roomTemplate,
          { merge: true }
        );
      })
    );
  }

  clearRoomTemplate(slotId: SlotId) {
    return this.user.pipe(
      switchMap(user => {
        if (!user) {
          return of(undefined);
        }
        return deleteDoc(
          doc(this.firestore, `userDetails/${user.uid}/roomTemplates/${slotId}`)
        );
      })
    );
  }

  getRoomTemplates(): Observable<RoomTemplate[]> {
    return this.user.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        return collectionSnapshots(
          query(
            collection(this.firestore, `userDetails/${user.uid}/roomTemplates`)
          )
        ).pipe(
          map(snapshots => snapshots.map(doc => doc.data() as RoomTemplate))
        );
      })
    );
  }
}
