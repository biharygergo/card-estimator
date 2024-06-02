import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ModalCreator,
  createModal,
} from '../avatar-selector-modal/avatar-selector-modal.component';
import { JiraService } from 'src/app/services/jira.service';
import { of, switchMap, take, tap } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
import { JiraResource } from 'src/app/types';
import { FirebaseModule } from 'src/app/firebase.module';

@Component({
  selector: 'app-configure-jira-integration-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FirebaseModule
  ],
  templateUrl: './configure-jira-integration-modal.component.html',
  styleUrl: './configure-jira-integration-modal.component.scss',
})
export class ConfigureJiraIntegrationModalComponent {
  customFieldIdControl = new FormControl<string>(
    this.dialogData.jiraResource.storyPointsCustomFieldId ?? '',
    { nonNullable: true }
  );

  constructor(
    private readonly jiraService: JiraService,
    @Inject(MAT_DIALOG_DATA) private dialogData: { jiraResource: JiraResource },
    private readonly toastService: ToastService,
    private readonly dialogRef: MatDialogRef<ConfigureJiraIntegrationModalComponent>
  ) {}

  onSave() {
    this.jiraService
      .getIntegration()
      .pipe(
        take(1),
        switchMap((jiraIntegration) => {
          const jiraResource = jiraIntegration.jiraResources.find(
            (r) => r.id === this.dialogData.jiraResource.id
          );
          if (!jiraResource) {
            this.toastService.showMessage(
              'Could not find integration',
              3000,
              'error'
            );
            return of(undefined);
          }

          jiraResource.storyPointsCustomFieldId =
            this.customFieldIdControl.value;

          return this.jiraService
            .updateJiraResourceList(jiraIntegration.jiraResources)
            .pipe(
              tap(() => {
                this.toastService.showMessage('Custom field updated.');
                this.dialogRef.close();
              })
            );
        })
      )
      .subscribe();
  }
}

export const configureJiraModalCreator = (jiraResource: JiraResource) =>
  createModal(ConfigureJiraIntegrationModalComponent, {
    id: 'configureJiraModal',
    data: { jiraResource },
  });
