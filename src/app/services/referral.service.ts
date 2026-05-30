import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';
import { ReferralStats } from '../types';

@Injectable({
  providedIn: 'root',
})
export class ReferralService {
  async getReferralStats(): Promise<ReferralStats & { referralCode: string }> {
    const callable = httpsCallable<void, ReferralStats & { referralCode: string }>(
      functions,
      'getReferralStats'
    );

    const result = await callable();
    return result.data;
  }
}
