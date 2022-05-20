import { Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { signInAnonymously, updateProfile, User } from 'firebase/auth';
import { EMPTY, firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public readonly user: Observable<User | null> = EMPTY;

  constructor(private auth: Auth) {
    this.user = user(this.auth);
  }

  async loginAnonymously(displayName?: string) {
    await signInAnonymously(this.auth);
    const user = await this.getUser();
    await updateProfile(user, { displayName })
    return user;
  }

  getUser(): Promise<User | null> {
    return firstValueFrom(this.user);
  }
}
