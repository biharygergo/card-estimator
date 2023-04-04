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
import { ZoomApiService } from 'src/app/services/zoom-api.service';
import { RichTopic } from 'src/app/types';

@Component({
  selector: 'app-rich-topic',
  templateUrl: './rich-topic.component.html',
  styleUrls: ['./rich-topic.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RichTopicComponent implements OnChanges {
  @Input() richTopic: RichTopic | null | undefined;
  @Input() enableEditing: boolean = false;

  @Output() deleted = new EventEmitter();

  cleanedMarkdown = '';

  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly zoomService: ZoomApiService,
    private readonly analyticsService: AnalyticsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['richTopic']) {
      const newTopic = changes['richTopic'].currentValue as
        | RichTopic
        | null
        | undefined;

      if (newTopic) {
        this.cleanedMarkdown = newTopic.description
          ?.replace(/\[([^[\]|]+?)\|([^[\]|]+?)\]/g, '[$2]($1)') // Named
          ?.replace(/\[([^|{}\\^~[\]\s"`]+\.[^|{}\\^~[\]\s"`]+)\]/g, '[$1]($1)') // Unnamed
          ?.replace(/\[([^[\]|]+?)\|([^[\]|]+?)\|(smart-link)\]/g, '[$2]($1)'); // Smart
      } else {
        this.cleanedMarkdown = '';
      }
    }
  }

  openRemoteTopic() {
    this.analyticsService.logClickedViewOnJiraButton();
    if (this.richTopic) {
      if (this.config.isRunningInZoom) {
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
}
