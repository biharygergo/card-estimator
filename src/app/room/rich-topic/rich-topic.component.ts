import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  importProvidersFrom,
  Inject,
  input,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { JiraService } from 'src/app/services/jira.service';
import { ToastService } from 'src/app/services/toast.service';
import { ZoomApiService } from 'src/app/services/zoom-api.service';
import { CardSetValue, RichTopic, RoundStatistics } from 'src/app/types';
import { finalize } from 'rxjs/operators';
import { PermissionsService } from 'src/app/services/permissions.service';
import jira2md from 'jira2md';
import { LinearService } from 'src/app/services/linear.service';
import {
  MARKED_OPTIONS,
  MarkdownComponent,
  MarkdownModule,
  MarkedOptions,
  MarkedRenderer,
  provideMarkdown,
} from 'ngx-markdown';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton } from '@angular/material/button';

// function that returns `MarkedOptions` with renderer override
export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();
  const linkRenderer = renderer.link;
  renderer.link = (href, title, text) => {
    const html = linkRenderer.call(renderer, href, title, text);
    return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
  };

  return {
    renderer: renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
  };
}

@Component({
    selector: 'app-rich-topic',
    templateUrl: './rich-topic.component.html',
    styleUrls: ['./rich-topic.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIconButton, MatTooltip, MatIcon, MarkdownComponent],
    providers: [
        provideMarkdown({
            markedOptions: {
                provide: MARKED_OPTIONS,
                useFactory: markedOptionsFactory,
            },
        }),
    ]
})
export class RichTopicComponent {
  richTopic = input.required<RichTopic | null | undefined>();
  enableEditing = input<boolean>(false);
  roundStatistics = input<RoundStatistics | undefined>();
  selectedEstimationCardSetValue = input<CardSetValue | undefined>();
  hideUploadButton = input<boolean | undefined>();

  @Output() deleted = new EventEmitter();

  cleanedMarkdown = computed<string>(() => {
    const newTopic = this.richTopic();
    if (newTopic?.description) {
      return newTopic.provider === 'jira'
        ? jira2md.to_markdown(newTopic.description)
        : newTopic.description;
    }
    return '';
  });
  isSavingToJira = signal<boolean>(false);

  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly zoomService: ZoomApiService,
    private readonly analyticsService: AnalyticsService,
    private readonly jiraService: JiraService,
    private readonly linearService: LinearService,
    private readonly toastService: ToastService,
    private readonly permissionService: PermissionsService
  ) {}

  openRemoteTopic() {
    this.analyticsService.logClickedViewOnJiraButton();
    if (this.richTopic()) {
      if (this.config.runningIn === 'zoom') {
        this.zoomService.openUrl(
          `${window.origin}/api/safeRedirect?redirectTo=${encodeURIComponent(
            this.richTopic().url
          )}`
        );
      } else {
        window.open(this.richTopic().url, '_blank');
      }
    }
  }

  saveEstimateToJira() {
    const providerName =
      this.richTopic()?.provider === 'linear' ? 'Linear' : 'Jira';

    if (
      !this.selectedEstimationCardSetValue() ||
      !this.roundStatistics()?.consensus
    ) {
      this.toastService.showMessage(
        `No votes cast yet. Vote before uploading results to ${providerName}.`
      );
      return;
    }

    const providerService =
      this.richTopic()?.provider === 'linear'
        ? this.linearService
        : this.jiraService;

    this.toastService.showMessage(`Saving to ${providerName}, hold tight...`);

    this.isSavingToJira.set(true);
    const convertedMajority =
      this.roundStatistics()?.consensusOverride ??
      this.roundStatistics()?.consensus.value;

    providerService
      .updateIssue({
        issueId: this.richTopic().key,
        storyPoints: convertedMajority,
      })
      .pipe(
        finalize(() => {
          this.isSavingToJira.set(false);
        })
      )
      .subscribe((result) => {
        if (result.success) {
          this.toastService.showMessage(
            `Awesome! Majority vote is saved to ${providerName}.`
          );
        } else {
          this.toastService.showMessage(
            `Oh-oh, something went wrong while uploading to ${providerName}.`
          );
        }
      });
  }
}
