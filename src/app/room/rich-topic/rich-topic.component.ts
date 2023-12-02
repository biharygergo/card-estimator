import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { JiraService } from 'src/app/services/jira.service';
import { ToastService } from 'src/app/services/toast.service';
import { ZoomApiService } from 'src/app/services/zoom-api.service';
import {
  CardSetValue,
  RichTopic,
  RoundStatistics,
  isNumericCardSet,
} from 'src/app/types';
import { finalize } from 'rxjs/operators';
import { EstimateConverterPipe } from 'src/app/pipes/estimate-converter.pipe';
import { PermissionsService } from 'src/app/services/permissions.service';
import * as jira2md from 'jira2md';

@Component({
  selector: 'app-rich-topic',
  templateUrl: './rich-topic.component.html',
  styleUrls: ['./rich-topic.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RichTopicComponent implements OnChanges {
  @Input() richTopic: RichTopic | null | undefined;
  @Input() enableEditing: boolean = false;
  @Input() roundStatistics?: RoundStatistics;
  @Input() selectedEstimationCardSetValue?: CardSetValue;

  @Output() deleted = new EventEmitter();

  cleanedMarkdown = '';
  isSavingToJira = false;

  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly zoomService: ZoomApiService,
    private readonly analyticsService: AnalyticsService,
    private readonly jiraService: JiraService,
    private readonly toastService: ToastService,
    private readonly permissionService: PermissionsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['richTopic']) {
      const newTopic = changes['richTopic'].currentValue as
        | RichTopic
        | null
        | undefined;

      if (newTopic?.description) {
        this.cleanedMarkdown = jira2md.to_markdown(newTopic.description);
      } else {
        this.cleanedMarkdown = '';
      }
    }
  }

  openRemoteTopic() {
    this.analyticsService.logClickedViewOnJiraButton();
    if (this.richTopic) {
      if (this.config.runningIn === 'zoom') {
        this.zoomService.openUrl(
          `${window.origin}/api/safeRedirect?redirectTo=${encodeURIComponent(
            this.richTopic.url
          )}`
        );
      } else {
        window.open(this.richTopic.url, '_blank');
      }
    }
  }

  saveEstimateToJira() {
    if (
      !this.selectedEstimationCardSetValue ||
      !this.roundStatistics?.consensus
    ) {
      this.toastService.showMessage(
        'No votes cast yet. Vote before uploading results to Jira.'
      );
      return;
    }

    if (!isNumericCardSet(this.selectedEstimationCardSetValue)) {
      this.toastService.showMessage(
        'Jira only supports numeric story points. Please choose a different card set.'
      );
      return;
    }

    this.toastService.showMessage('Saving to Jira, hold tight...');

    this.isSavingToJira = true;
    const convertedMajority = +new EstimateConverterPipe().transform(
      this.roundStatistics.consensus.value,
      this.selectedEstimationCardSetValue,
      'exact'
    );

    this.jiraService
      .updateIssue({
        issueId: this.richTopic.key,
        storyPoints: convertedMajority,
      })
      .pipe(
        finalize(() => {
          this.isSavingToJira = false;
        })
      )
      .subscribe((result) => {
        if (result.success) {
          this.toastService.showMessage(
            'Awesome! Majority vote is saved to Jira.'
          );
        } else {
          this.toastService.showMessage(
            'Oh-oh, something went wrong while uploading to Jira.'
          );
        }
      });
  }
}
