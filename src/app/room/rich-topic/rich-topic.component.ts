import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { ZoomApiService } from 'src/app/services/zoom-api.service';
import { RichTopic } from 'src/app/types';

@Component({
  selector: 'app-rich-topic',
  templateUrl: './rich-topic.component.html',
  styleUrls: ['./rich-topic.component.scss'],
})
export class RichTopicComponent implements OnChanges {
  @Input() richTopic: RichTopic | null | undefined;
  @Input() enableEditing: boolean = false;

  @Output() deleted = new EventEmitter();

  cleanedMarkdown = '';

  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly zoomService: ZoomApiService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['richTopic']) {
      const newTopic = changes['richTopic'].currentValue as
        | RichTopic
        | null
        | undefined;

      if (newTopic) {
        this.cleanedMarkdown = newTopic.description
          .replace(/\[([^[\]|]+?)\|([^[\]|]+?)\]/g, '[$2]($1)') // Named links
          .replace(/\[([^|{}\\^~[\]\s"`]+\.[^|{}\\^~[\]\s"`]+)\]/g, '[$1]($1)') // Unnamed links
          .replace(/\[([^[\]|]+?)\|([^[\]|]+?)\|(smart-link)\]/g, '[$2]($1)'); // Smart links
      } else {
        this.cleanedMarkdown = '';
      }
    }
  }

  openRemoteTopic() {
    if (this.richTopic) {
      if (this.config.isRunningInZoom) {
        this.zoomService.openUrl(this.richTopic.url);
      } else {
        window.open(this.richTopic.url, '_blank');
      }
    }
  }
}
