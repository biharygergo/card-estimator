import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { catchError, first, Observable, of, switchMap, tap } from 'rxjs';
import { AppConfig, APP_CONFIG } from 'src/app/app-config.module';
import { JiraService } from 'src/app/services/jira.service';
import { ToastService } from 'src/app/services/toast.service';
import { JiraIntegration, JiraResource } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { configureJiraModalCreator } from '../configure-jira-integration-modal/configure-jira-integration-modal.component';
import { MatDialog } from '@angular/material/dialog';

export const integrationsModalCreator =
  (): ModalCreator<IntegrationsComponent> => [
    IntegrationsComponent,
    {
      id: 'integrationsModal',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '98vh',
      panelClass: 'custom-dialog',
    },
  ];

@Component({
  selector: 'app-integrations',
  templateUrl: './integrations.component.html',
  styleUrls: ['./integrations.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class IntegrationsComponent {
  jiraIntegration$: Observable<JiraIntegration> =
    this.jiraService.getIntegration();
  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly jiraService: JiraService,
    private readonly toastService: ToastService,
    private readonly dialog: MatDialog
  ) {}

  onJiraProjectSelected(resource: JiraResource) {
    return this.jiraIntegration$
      .pipe(
        switchMap((jiraIntegration) => {
          jiraIntegration.jiraResources.forEach((r) => {
            r.active = r.id === resource.id;
          });
          return this.jiraService.updateJiraResourceList(
            jiraIntegration.jiraResources
          );
        }),
        first()
      )
      .subscribe(() => {
        this.toastService.showMessage(
          `${resource.url} has been set as the active project`
        );
      });
  }

  configureJiraResource(resource: JiraResource) {
    this.dialog.open(...configureJiraModalCreator(resource));
  }

  onJiraProjectRemoveClicked(resource: JiraResource) {
    return this.jiraIntegration$
      .pipe(
        switchMap((jiraIntegration) => {
          if (!jiraIntegration) {
            return of(undefined);
          }

          jiraIntegration.jiraResources = jiraIntegration.jiraResources.filter(
            (r) => r.id !== resource.id
          );

          if (jiraIntegration.jiraResources.length) {
            if (resource.active) {
              jiraIntegration.jiraResources[0].active = true;
            }
            return this.jiraService
              .updateJiraResourceList(jiraIntegration.jiraResources)
              .pipe(
                tap(() => {
                  this.toastService.showMessage(
                    `${resource.url} has been removed`
                  );
                })
              );
          } else {
            return this.jiraService.removeJiraIntegration().pipe(
              tap(() => {
                this.toastService.showMessage(
                  `Jira has been successfully disconnected`
                );
              })
            );
          }
        }),
        first()
      )
      .subscribe();
  }

  startJiraAuth() {
    this.jiraService.startJiraAuthFlow();
  }
}
