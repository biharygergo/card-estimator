import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastService } from '../../services/toast.service';
import { TeamsService } from '../../services/teams.service';
import { IntegrationsService, ShareRoomLinks } from '../../services/integrations.service';
import { AppConfig, APP_CONFIG } from '../../app-config.module';
import { createModal } from '../avatar-selector-modal/avatar-selector-modal.component';

export interface InvitationPopupData {
  roomId: string;
  roomUrl: string;
}

@Component({
  selector: 'app-invitation-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './invitation-popup.component.html',
  styleUrls: ['./invitation-popup.component.scss'],
})
export class InvitationPopupComponent implements OnInit, OnDestroy {
  private destroy = new Subject<void>();
  shareRoomLinks$: Observable<ShareRoomLinks>;
  funInvitationText: string = '';

  constructor(
    public dialogRef: MatDialogRef<InvitationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvitationPopupData,
    @Inject(APP_CONFIG) public config: AppConfig,
    public clipboard: Clipboard,
    public toastService: ToastService,
    private teamsService: TeamsService,
    private integrationsService: IntegrationsService
  ) {
    this.shareRoomLinks$ = this.integrationsService.getShareRoomLinks(data.roomId);
    this.funInvitationText = this.generateFunInvitationText();
  }

  ngOnInit(): void {
    // Component is now using the integrations service
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  copyRoomUrl() {
    this.clipboard.copy(this.data.roomUrl);
    this.toastService.showMessage('Room URL copied to clipboard!');
  }

  copyRoomId() {
    this.clipboard.copy(this.data.roomId);
    this.toastService.showMessage('Room ID copied to clipboard!');
  }

  private funMessages = [
    "I've found this awesome planning poker tool so we don't have to use any other tools anymore! Join me here:",
    "Let's level up our estimation game! I found this incredible planning poker tool - no more awkward spreadsheets! Join here:",
    "Time to make our planning sessions actually fun! Check out this amazing planning poker tool I discovered:",
    "Breaking news: I found the planning poker tool that will make our team actually enjoy estimation meetings! Join me:",
    "Innovation alert! I discovered a planning poker tool that's so good, it might just make our retrospectives obsolete. Try it:",
    "Plot twist: I found a planning poker tool that's actually enjoyable to use! Let's revolutionize our planning:",
    "Step right up! I've discovered the planning poker tool that will make our team meetings the highlight of everyone's week:",
    "Hot take: This planning poker tool is so good, it might just be the best thing since sliced bread. Join the revolution:",
    "Our estimation accuracy is about to go through the roof! I found this planning poker tool that makes everything super precise:",
    "Finally, a planning poker tool that will make our estimates so accurate, we might not need to re-estimate anything ever again:",
    "I discovered a planning poker tool that's going to make our team the estimation experts of the company. Check it out:",
    "This planning poker tool is so good at getting accurate estimates, it's like having a crystal ball for project planning:"
  ];

  private generateFunInvitationText(): string {
    const randomMessage = this.funMessages[Math.floor(Math.random() * this.funMessages.length)];
    return `${randomMessage}\n\n${this.data.roomUrl}`;
  }

  getInvitationMessage(): string {
    return this.funInvitationText.split('\n\n')[0];
  }

  copyFunInvitation() {
    this.clipboard.copy(this.funInvitationText);
    this.toastService.showMessage('Irresistible invitation copied! 🎉');
  }

  executeAction(action: any) {
    action.action().subscribe((message: string) => {
      this.toastService.showMessage(message);
      if (message.includes('Started sharing app to meeting stage')) {
        this.dialogRef.close();
      }
    });
  }

  copyIntegrationLink(integration: { name: string; url: string; icon: string }) {
    this.clipboard.copy(integration.url);
    this.toastService.showMessage(`${integration.name} link copied!`);
  }

  close() {
    this.dialogRef.close();
  }
}

export const invitationPopupCreator = (data: InvitationPopupData) =>
  createModal(InvitationPopupComponent, {
    id: 'invitationPopup',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    panelClass: 'custom-dialog',
    data,
    disableClose: false,
  });
