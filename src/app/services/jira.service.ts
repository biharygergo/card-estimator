import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import {
  doc,
  docData,
  DocumentReference,
  Firestore,
} from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { first, map, Observable, of, switchMap, tap } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import { JiraIntegration, JiraIssue } from '../types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class JiraService {
  API_URL = 'http://localhost:5001/card-estimator/us-central1'; // ``${window.location.origin}/api`;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private functions: Functions,
    private http: HttpClient,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {}

  startJiraAuthFlow() {
    const apiUrl = `${this.API_URL}/startJiraAuth`;
    window.location.assign(apiUrl);
  }

  getIntegration(): Observable<JiraIntegration> {
    return this.authService.user.pipe(
      switchMap((user) => {
        if (!user || user.isAnonymous) {
          return of(undefined);
        }

        const jiraDoc = docData<JiraIntegration>(
          doc(
            this.firestore,
            `userDetails/${user.uid}/integrations/jira`
          ) as DocumentReference<JiraIntegration>
        );
        return jiraDoc;
      })
    );
  }

  getIssues(query?: string): Observable<JiraIssue[]> {
    const params = query
      ? '?' + new URLSearchParams({ search: query }).toString()
      : '';
    return this.http
      .get(`${this.API_URL}/queryJiraIssues${params}`)
      .pipe(map((response) => response as JiraIssue[]));
  }
}
