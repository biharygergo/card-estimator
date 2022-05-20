import { Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { signInAnonymously, User } from 'firebase/auth';
import { EMPTY, firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public readonly user: Observable<User | null> = EMPTY;

  constructor(private auth: Auth) {
    this.user = user(this.auth);
  }

  async loginAnonymously() {
    return await signInAnonymously(this.auth);
  }

  getUser(): Promise<User | null> {
    return firstValueFrom(this.user);
  }
}
