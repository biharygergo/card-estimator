import { Component, Inject, ViewEncapsulation } from '@angular/core';
import {
  catchError,
  first,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { AppConfig, APP_CONFIG } from 'src/app/app-config.module';
import { JiraService } from 'src/app/services/jira.service';
import { ToastService } from 'src/app/services/toast.service';
import { JiraIntegration, JiraResource } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { configureJiraModalCreator } from '../configure-jira-integration-modal/configure-jira-integration-modal.component';
import {
  MatDialog,
  MatDialogTitle,
  MatDialogContent,
} from '@angular/material/dialog';
import { LinearService } from 'src/app/services/linear.service';
import { AsyncPipe } from '@angular/common';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatAnchor, MatButton } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { SlackService } from 'src/app/services/slack.service';

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
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatAnchor,
    MatButton,
    MatRadioGroup,
    MatRadioButton,
    AsyncPipe,
  ],
})
export class IntegrationsComponent {
  jiraIntegration$: Observable<JiraIntegration> = this.jiraService
    .getIntegration()
    .pipe(shareReplay(1));
  linearIntegration$ = this.linearService.getIntegration().pipe(shareReplay(1));
  slackIntegration = toSignal(this.slackService.getIntegration());

  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly jiraService: JiraService,
    private readonly linearService: LinearService,
    private readonly slackService: SlackService,
    private readonly toastService: ToastService,
    private readonly dialog: MatDialog
  ) {}

  onJiraProjectSelected(resource: JiraResource) {
    return this.jiraIntegration$
      .pipe(
        switchMap(jiraIntegration => {
          jiraIntegration.jiraResources.forEach(r => {
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
        switchMap(jiraIntegration => {
          if (!jiraIntegration) {
            return of(undefined);
          }

          jiraIntegration.jiraResources = jiraIntegration.jiraResources.filter(
            r => r.id !== resource.id
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

  startLinearAuth() {
    this.linearService.startLinearAuthFlow();
  }

  removeLinearIntegration() {
    this.linearService.removeLinearIntegration().subscribe();
  }

  startSlackAuth() {
    this.slackService.startSlackAuthFlow();
  }

  removeSlackIntegration() {
    this.slackService.removeSlackIntegration().subscribe();
  }
}
