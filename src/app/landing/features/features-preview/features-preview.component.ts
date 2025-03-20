import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
    selector: 'planning-poker-features-preview',
    templateUrl: './features-preview.component.html',
    styleUrl: './features-preview.component.scss',
    imports: [NgOptimizedImage, RouterLink]
})
export class FeaturesPreviewComponent {

}
