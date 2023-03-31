import { Component, Inject } from '@angular/core';
import { AppConfig, APP_CONFIG } from 'src/app/app-config.module';
import { JiraService } from 'src/app/services/jira.service';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

export const integrationsModalCreator =
  (): ModalCreator<IntegrationsComponent> => [
    IntegrationsComponent,
    {
      id: 'integrationsModal',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
    },
  ];

@Component({
  selector: 'app-integrations',
  templateUrl: './integrations.component.html',
  styleUrls: ['./integrations.component.scss'],
})
export class IntegrationsComponent {
  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly jiraService: JiraService
  ) {}
}
