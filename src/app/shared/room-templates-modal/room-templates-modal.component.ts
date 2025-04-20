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
import {
  CARD_SETS,
  CardSetOrCustom,
  CardSetValue,
  Room,
  RoomPermissionId,
  RoomTemplate,
  SlotId,
} from 'src/app/types';
import { AuthService } from 'src/app/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { EstimatorService } from 'src/app/services/estimator.service';
import { getSortedCardSetValues } from 'src/app/utils';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PermissionsService } from 'src/app/services/permissions.service';

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
    MatTooltipModule,
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
      map(templates => {
        const result = templates.reduce((acc, template) => {
          acc[template.slotId] = template;
          return acc;
        }, {} as { [key: string]: RoomTemplate | null });
        return result;
      })
    ),
    { initialValue: {} as { [key: string]: RoomTemplate | null } }
  );

  hasActiveRoom = toSignal(
    this.roomDataService.room$.pipe(map(room => !!room))
  );

  canApplyTemplates = toSignal(
    this.permissionsService.hasPermission(RoomPermissionId.CAN_APPLY_TEMPLATES)
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) private dialogData: RoomTemplatesModalData,
    private dialogRef: MatDialogRef<RoomTemplatesModalComponent>,
    private authService: AuthService,
    private toastService: ToastService,
    private roomDataService: RoomDataService,
    private estimatorService: EstimatorService,
    private confirmService: ConfirmDialogService,
    private permissionsService: PermissionsService
  ) {}

  async saveAsTemplate(slotId: SlotId) {
    const room = await firstValueFrom(this.roomDataService.room$.pipe(take(1)));
    const authorizationMetadata = await firstValueFrom(
      this.estimatorService.getAuthorizationMetadata(room.roomId)
    );

    if (!room) {
      this.toastService.showMessage('No room found');
      return;
    }

    const template: RoomTemplate = {
      slotId,
      name: this.SLOT_NAMES[slotId],
      cardSetId: room.cardSet,
      customCardSetValue: room.customCardSetValue,
      isAsyncVotingEnabled: room.isAsyncVotingEnabled,
      isAnonymousVotingEnabled: room.isAnonymousVotingEnabled,
      isChangeVoteAfterRevealEnabled: room.isChangeVoteAfterRevealEnabled,
      isAutoRevealEnabled: room.isAutoRevealEnabled,
      timerDuration: room.timer?.countdownLength,
      permissions: room.configuration?.permissions,
      showPassOption: room.showPassOption,
      organizationProtection:
        authorizationMetadata?.organizationProtection ?? undefined,
    };

    await firstValueFrom(this.authService.setRoomTemplate(slotId, template));
    this.toastService.showMessage('Template saved successfully');
  }

  async clearTemplate(slotId: SlotId) {
    const result = await this.confirmService.openConfirmationDialog({
      title: 'Delete template',
      content: 'Are you sure you want to delete this template?',
    });
    if (result) {
      await firstValueFrom(this.authService.clearRoomTemplate(slotId));
      this.toastService.showMessage('Template deleted');
    }
  }

  async applyTemplate(template: RoomTemplate) {
    const result = await this.confirmService.openConfirmationDialog({
      title: 'Apply template',
      content:
        'Are you sure you want to apply this template? It will override the current room settings.',
    });
    if (result) {
      const room = await firstValueFrom(
        this.roomDataService.room$.pipe(take(1))
      );

      const updatedRoom: Room = {
        ...room,
        cardSet: template.cardSetId ?? room.cardSet,
        customCardSetValue:
          template.customCardSetValue ?? room.customCardSetValue,
        isAsyncVotingEnabled:
          template.isAsyncVotingEnabled ?? room.isAsyncVotingEnabled,
        isAnonymousVotingEnabled:
          template.isAnonymousVotingEnabled ?? room.isAnonymousVotingEnabled,
        isChangeVoteAfterRevealEnabled:
          template.isChangeVoteAfterRevealEnabled ??
          room.isChangeVoteAfterRevealEnabled,
        isAutoRevealEnabled:
          template.isAutoRevealEnabled ?? room.isAutoRevealEnabled,
        showPassOption: template.showPassOption ?? room.showPassOption,
        timer: template.timerDuration
          ? {
              ...room.timer,
              countdownLength: template.timerDuration,
              initialCountdownLength: template.timerDuration,
            }
          : room.timer,
        configuration: room.configuration
          ? {
              ...room.configuration,
              permissions:
                template.permissions ?? room.configuration?.permissions,
            }
          : undefined,
      };

      await this.estimatorService.updateRoom(room.roomId, updatedRoom);

      if (template.organizationProtection) {
        await this.estimatorService.toggleOrganizationProtection(
          room.roomId,
          true,
          template.organizationProtection
        );
      } else {
        await this.estimatorService.toggleOrganizationProtection(
          room.roomId,
          false,
          ''
        );
      }

      this.toastService.showMessage('Template applied successfully');
    }
  }

  getCardSetValues(
    cardSetId: CardSetOrCustom,
    customCardSetValue?: CardSetValue
  ) {
    const values = CARD_SETS[cardSetId] ?? customCardSetValue;

    return getSortedCardSetValues(values)
      .map(item => item.value)
      .join(', ');
  }
}
