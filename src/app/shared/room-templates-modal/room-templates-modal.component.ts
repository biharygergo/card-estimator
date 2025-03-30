import { Component, Inject, signal } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { ToastService } from 'src/app/services/toast.service';
import { RoomDataService } from 'src/app/room/room-data.service';
import { map, take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { RoomTemplate, SlotId } from 'src/app/types';
import { AuthService } from 'src/app/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

export interface RoomTemplatesModalData {}

export const roomTemplatesModalCreator = (
  data: RoomTemplatesModalData
): ModalCreator<RoomTemplatesModalComponent> => [
  RoomTemplatesModalComponent,
  {
    id: 'roomTemplatesModal',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
    data,
  },
];

@Component({
  selector: 'app-room-templates-modal',
  templateUrl: './room-templates-modal.component.html',
  styleUrls: ['./room-templates-modal.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatIconButton,
    MatDialogClose,
    MatIcon,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    
  ],
})
export class RoomTemplatesModalComponent {
  readonly SLOT_IDS = [SlotId.TemplateA, SlotId.TemplateB, SlotId.TemplateC];
  readonly SLOT_NAMES = {
    [SlotId.TemplateA]: 'Template A',
    [SlotId.TemplateB]: 'Template B',
    [SlotId.TemplateC]: 'Template C',
  };

  templates = toSignal(
    this.authService.getRoomTemplates().pipe(
      map((templates) => {
        const result = templates.reduce((acc, template) => {
          acc[template.slotId] = template;
          return acc;
        }, {} as { [key: string]: RoomTemplate | null });
        console.log(result);
        return result;
      })
    ),
    { initialValue: {} as { [key: string]: RoomTemplate | null } }
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) private dialogData: RoomTemplatesModalData,
    private dialogRef: MatDialogRef<RoomTemplatesModalComponent>,
    private authService: AuthService,
    private toastService: ToastService,
    private roomDataService: RoomDataService
  ) {}

  async saveAsTemplate(slotId: SlotId) {
    const room = await firstValueFrom(this.roomDataService.room$.pipe(take(1)));
    if (!room) {
      this.toastService.showMessage('No room found');
      return;
    }

    const template: RoomTemplate = {
      slotId,
      name: this.SLOT_NAMES[slotId],
      cardSetId: room.cardSet,
      isAsyncVotingEnabled: room.isAsyncVotingEnabled,
      isAnonymousVotingEnabled: room.isAnonymousVotingEnabled,
      isChangeVoteAfterRevealEnabled: room.isChangeVoteAfterRevealEnabled,
      timerDuration: room.timer?.countdownLength,
      permissions: room.configuration?.permissions,
    };

    await firstValueFrom(this.authService.setRoomTemplate(slotId, template));
    this.toastService.showMessage('Template saved successfully');
  }

  async clearTemplate(slotId: SlotId) {
    await firstValueFrom(this.authService.clearRoomTemplate(slotId));
    this.toastService.showMessage('Template cleared');
  }

  async applyTemplate(template: RoomTemplate) {
    // TODO: Apply timer settings and permissions
    // This will be implemented when we add timer settings functionality

    this.toastService.showMessage('Template applied successfully');
    this.dialogRef.close();
  }
}
