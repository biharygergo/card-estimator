import { Component } from '@angular/core';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { NgOptimizedImage } from '@angular/common';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-getting-started',
  imports: [
    PageHeaderComponent,
    NgOptimizedImage,
    StartPlanningCtaComponent,
    RouterLink,
    MatIcon,
    MatButtonModule,
  ],
  templateUrl: './getting-started.component.html',
  styleUrl: './getting-started.component.scss',
})
export class GettingStartedComponent {} 