import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { ReferralStats } from '../types';

@Injectable({
  providedIn: 'root',
})
export class ReferralService {
  constructor(private functions: Functions) {}

  async getReferralStats(): Promise<ReferralStats & { referralCode: string }> {
    const callable = httpsCallable<void, ReferralStats & { referralCode: string }>(
      this.functions,
      'getReferralStats'
    );

    const result = await callable();
    return result.data;
  }
}
