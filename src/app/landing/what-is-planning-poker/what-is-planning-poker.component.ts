import { Component } from '@angular/core';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { NgOptimizedImage } from '@angular/common';
import { YoutubePlayerComponent } from 'src/app/shared/youtube-player/youtube-player.component';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';
@Component({
  selector: 'app-what-is-planning-poker',
  imports: [PageHeaderComponent, NgOptimizedImage, YoutubePlayerComponent, StartPlanningCtaComponent],
  templateUrl: './what-is-planning-poker.component.html',
  styleUrl: './what-is-planning-poker.component.scss'
})
export class WhatIsPlanningPokerComponent {

}
