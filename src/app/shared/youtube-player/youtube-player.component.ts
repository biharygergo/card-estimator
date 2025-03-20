import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  input,
  Signal,
  signal,
  viewChild,
} from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';

@Component({
    selector: 'app-youtube-player',
    imports: [YouTubePlayer],
    templateUrl: './youtube-player.component.html',
    styleUrl: './youtube-player.component.scss'
})
export class YoutubePlayerComponent implements AfterViewInit {
  youtubeVideoId = input.required<string>();

  youtubePlayerContainer: Signal<ElementRef<HTMLDivElement>> = viewChild(
    'youtubePlayerContainer'
  );
  youtubePlayerSize = signal({ width: 560, height: 315 });
  ngAfterViewInit() {
    this.onResize();
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.youtubePlayerContainer()) {
      const width = this.youtubePlayerContainer().nativeElement.clientWidth;
      const height = width * 0.56;

      this.youtubePlayerSize.set({ width, height });
    }
  }
}
