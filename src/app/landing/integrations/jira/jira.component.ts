import { Component, inject } from '@angular/core';
import { IntegrationConfig, IntegrationPageTemplateComponent } from '../shared/integration-page-template/integration-page-template.component';
import { JiraService } from 'src/app/services/jira.service';

@Component({
    selector: 'app-jira',
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
      faqs: [
        {
          question: 'How do I set up the Jira integration?',
          answer: 'Setting up Jira integration is straightforward. Click "Connect Jira" in your planning session, authorize through Atlassian (we only request minimal permissions to read issues and update story points), and you\'re ready to go. Works with both Jira Cloud and Data Center.',
        },
        {
          question: 'Is the Jira integration free to use?',
          answer: 'Yes! The Jira integration is completely free. You can import issues, estimate them with your team, and sync story points back to Jira at no additional cost. This includes unlimited issues and projects.',
        },
        {
          question: 'How does the Jira integration work?',
          answer: 'Once connected, you can import issues from any of your Jira projects. During planning sessions, story points are automatically synced back to Jira when consensus is reached. You can also bulk import multiple issues for efficient sprint planning.',
        },
        {
          question: 'What permissions does the Jira integration need?',
          answer: 'We only request essential permissions: read access to view your issues and write access to update story points. We follow security best practices and don\'t request access to sensitive data or admin capabilities.',
        },
        {
          question: 'Can I use Jira integration in video calls?',
          answer: 'Yes! The Jira integration works seamlessly with our <a href="/integrations">video conferencing integrations</a>. Whether you\'re using Teams, Zoom, Meet, or Webex, you can import and estimate Jira issues directly in your meetings.',
        }
      ],
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
