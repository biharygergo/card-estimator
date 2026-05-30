import { Inject, Injectable } from '@angular/core';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { AuthService } from './auth.service';
import { from, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import { Platform } from '../types';

export interface IssueReport {
  details: string;
  email: string;
  timestamp: any; // serverTimestamp
  userId?: string;
  userAgent?: string;
  url?: string;
  platform?: Platform;
}

@Injectable({
  providedIn: 'root',
})
export class IssueReportService {
  private readonly ISSUE_REPORTS_COLLECTION = 'issueReports';

  constructor(
    private authService: AuthService,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {}

  submitIssueReport(
    issueReport: Omit<
      IssueReport,
      'timestamp' | 'userId' | 'userAgent' | 'url' | 'platform'
    >
  ): Observable<any> {
    return from(this.authService.getUser()).pipe(
      take(1),
      switchMap(user => {
        const report: IssueReport = {
          ...issueReport,
          userId: user?.uid || null,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: serverTimestamp(),
          platform: this.config.runningIn,
        };

        return from(
          addDoc(
            collection(firestore, this.ISSUE_REPORTS_COLLECTION),
            report
          )
        );
      })
    );
  }
}
