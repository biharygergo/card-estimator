import { Component, inject } from '@angular/core';
import { LinearService } from 'src/app/services/linear.service';
import { IntegrationConfig, IntegrationPageTemplateComponent } from '../shared/integration-page-template/integration-page-template.component';

@Component({
  selector: 'app-linear',
  standalone: true,
  imports: [IntegrationPageTemplateComponent],
  templateUrl: './linear.component.html',
  styleUrl: './linear.component.scss'
})
export class LinearComponent {
  private readonly linearService = inject(LinearService);
  config: IntegrationConfig = {
    header: {
      title: 'Estimate Linear Issues with PlanningPoker.live',
      description:
        'Connect your PlanningPoker.live account with Linear to seamlessly estimate issues from your workspace. Quickly import issues from your backlog to your planning poker sessions for collaborative estimation.',
      buttonLabel: 'Connect to Linear',
      videoId: 'Linear_Optimized_pu8atx',
      aspectRatio: '1920/1080',
    },
    details: {
      description:
        'Integrate PlanningPoker.live with Linear to select and view Linear issues directly during your planning poker session. This integration streamlines your workflow and boosts your team’s productivity.',
      steps: [
        {
          title: 'Step 1: Connect your Linear account to PlanningPoker.live',
          text: "Start by clicking the 'Connect to Linear' button at the top of this page. This links your Linear account with PlanningPoker.live, enabling you to fetch and estimate issues from your workspace. If you don’t already have a free PlanningPoker.live account, you’ll be prompted to create one.",
          imgId: 'linear-connect-screen',
          alt: 'Linear authentication screen',
          width: 3656,
          height: 2356
        },
        {
          title: 'Step 2: Select and estimate Linear issues',
          text: 'After connecting your Linear account, your recent Linear issues will appear in the topic editor dropdown menu. Use the search functionality to find specific issues by title or ID. Once selected, your team can begin voting on the issue. After the estimates are finalized, they are automatically synced back to Linear.',
          imgId: 'linear-issues-dropdown',
          alt: 'Linear issues dropdown',
          width: 3656,
          height: 2356
        },
        {
          title: 'Step 3: Import multiple tickets in batch',
          text: 'Effortlessly import multiple issues using our batch import feature. Apply filters, such as project or status, to refine your selection. This ensures you’re importing only the relevant issues from your Linear workspace, saving time and effort.',
          imgId: 'linear-batch-import-modal',
          alt: 'Linear batch import modal',
          width: 3656,
          height: 2356
        },
        {
          title: 'Step 4: Collaborate and finalize estimates',
          text: 'During the planning poker session, team members can collaboratively vote on story points, discuss tasks, and reach a consensus on estimates. This fosters teamwork and results in accurate and realistic project timelines.',
          imgId: 'linear-issue-selected',
          alt: 'Linear issue selected',
          width: 3656,
          height: 2356
        },
      ],
    },
    action: () => {
      this.linearService.startLinearAuthFlow();
    },
  };

}