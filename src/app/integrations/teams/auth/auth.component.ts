import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  AuthProgressState,
  authProgressDialogCreator,
} from 'src/app/shared/auth-progress-dialog/auth-progress-dialog.component';
import { AuthIntent } from 'src/app/services/auth.service';
import { TeamsService } from 'src/app/services/teams.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly teamsService: TeamsService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const returnToPath = this.route.snapshot.queryParamMap.get('returnToPath');
    const authIntent = this.route.snapshot.queryParamMap.get(
      'authIntent'
    ) as AuthIntent;

    this.teamsService.configureApp().then(() => {
      this.teamsService.notifySuccess(token);
    })

   /*  this.dialog.open(
      ...authProgressDialogCreator({
        initialState: AuthProgressState.IN_PROGRESS,
        startAccountSetupOnOpen: true,
        authData: {
          authIntent,
          idToken: token,
          returnToPath,
          createdAt: undefined,
        },
      })
    ); */
  }
}
