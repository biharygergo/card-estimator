import {
  CommonModule,
  NgOptimizedImage,
  provideCloudinaryLoader,
} from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'start-planning-cta',
  templateUrl: './start-planning-cta.component.html',
  styleUrls: ['./start-planning-cta.component.scss'],
  imports: [CommonModule, MatButtonModule, NgOptimizedImage, RouterModule],
  providers: [provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc')],
})
export class StartPlanningCtaComponent {}
