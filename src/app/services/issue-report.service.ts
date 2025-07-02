import { Inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
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
    private firestore: Firestore,
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
            collection(this.firestore, this.ISSUE_REPORTS_COLLECTION),
            report
          )
        );
      })
    );
  }
}
