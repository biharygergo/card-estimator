import { Component, inject } from '@angular/core';
import { IntegrationConfig, IntegrationPageTemplateComponent } from '../shared/integration-page-template/integration-page-template.component';
import { JiraService } from 'src/app/services/jira.service';

@Component({
  selector: 'app-jira',
  standalone: true,
  imports: [IntegrationPageTemplateComponent],
  templateUrl: './jira.component.html',
  styleUrl: './jira.component.scss'
})
export class JiraComponent {
  private readonly jiraService = inject(JiraService);
  config: IntegrationConfig = {
    header: {
      title: 'Estimate Jira Issues with PlanningPoker.live',
      description:
        'Connect your PlanningPoker.live account with Jira to estimate issues directly from your backlog. Use advanced filters to import only the issues you need from your active sprint or project.',
      buttonLabel: 'Connect to Jira',
      videoId: 'Jira_Optimized_2_tugns9',
      aspectRatio: '1920/1080',
    },
    details: {
      description:
        'Integrate PlanningPoker.live with Jira to select and view Jira issues directly from the planning poker session. Follow these steps to connect your Jira account and start estimating issues with your team:',
      youtubeVideo: {
        title: 'Get started quickly with our tutorial video on integrating Jira with PlanningPoker.live',
        videoId: 'X5ox2EBk3Bs',
      },
      steps: [
        {
          title: 'Step 1: Connect your Jira account to PlanningPoker.live',
          text: "Begin by clicking the 'Connect to Jira' button at the top of this page. This will link your Jira account with PlanningPoker.live, allowing you to select and view Jira issues directly from the planning poker session. If you do not have a free PlanningPoker.live account, you'll be prompted to create one.",
          imgId: 'jira-auth-screen',
          alt: 'Jira authentication screen',
          width: 3656,
          height: 2356
        },
        {
          title: 'Step 2: Select and estimate Jira issues',
          text: 'Once your Jira account is connected, your most recent Jira issues will automatically appear in the dropdown menu of the topic editor. You can also search for specific issues by title or ID. When you select an issue, your team can start voting on it. After the estimates are revealed, simply click the "Upload" button to save the estimate back to Jira.',
          imgId: 'jira-issues-dropdown',
          alt: 'Jira issues dropdown',
          width: 3656,
          height: 2356
        },
        {
          title: 'Step 3: Import multiple tickets in batch',
          text: 'You can select topics one-by-one or import multiple tickets in batch. Our batch import feature allows you to filter your tickets by a variety of filters, including project, sprint, and issue type. This helps you import only the issues you need from your active sprint or project, saving you time and effort.',
          imgId: 'jira-batch-import-modal',
          alt: 'Jira batch import modal',
          width: 3656,
          height: 2356
        },
        {
          title: 'Step 4: Collaborate and finalize estimates',
          text: 'During the planning poker session, team members can vote on story points, share insights, and collaborate to reach a consensus on estimates. This helps to improve communication and collaboration within the team, leading to more realistic estimates and increased team confidence.',
          imgId: 'jira-issue-selected',
          alt: 'Jira issue selected',
          width: 3656,
          height: 2356
        },
      ],
    },
    action: () => {
      this.jiraService.startJiraAuthFlow();
    },
  };
}
