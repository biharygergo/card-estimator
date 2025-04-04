import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from 'src/app/shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { MatAnchor, MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardHeader,
  MatCardContent,
  MatCardActions,
} from '@angular/material/card';

type InvitationResult =
  | 'success'
  | 'invitation-not-found'
  | 'organization-not-found'
  | 'user-not-found';

@Component({
  selector: 'app-organization-invitation',
  templateUrl: './organization-invitation.component.html',
  styleUrls: ['./organization-invitation.component.scss'],
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardActions,
    MatAnchor,
    RouterLink,
    MatButton,
  ],
})
export class OrganizationInvitationComponent implements OnInit, OnDestroy {
  result: Observable<InvitationResult> = this.activatedRoute.queryParamMap.pipe(
    map(params => params.get('result') as InvitationResult)
  );

  invitationId: string | undefined =
    this.activatedRoute.snapshot.queryParamMap.get('invitationId');
  organizationId: string | undefined =
    this.activatedRoute.snapshot.queryParamMap.get('organizationId');

  invitationResult: InvitationResult;
  destroy = new Subject<void>();

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.result
      .pipe(takeUntil(this.destroy))
      .subscribe(res => (this.invitationResult = res));
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async openAuthModal() {
    const user = await this.authService.getUser();

    const dialogRef = this.dialog.open(
      ...signUpOrLoginDialogCreator({
        intent: user
          ? SignUpOrLoginIntent.LINK_ACCOUNT
          : SignUpOrLoginIntent.CREATE_ACCOUNT,
      })
    );

    await firstValueFrom(dialogRef.afterClosed());
    const newUser = await this.authService.getUser();

    if (!newUser || user?.isAnonymous) {
      return;
    }

    window.open(
      `${window.origin}/api/acceptOrganizationInvitation?invitationId=${this.invitationId}&organizationId=${this.organizationId}`
    );
  }
}
