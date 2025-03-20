import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HeaderV2Component } from '../header-v2/header-v2.component';
import { NgOptimizedImage } from '@angular/common';

@Component({
    selector: 'app-wrapper',
    templateUrl: './wrapper.component.html',
    styleUrls: ['./wrapper.component.scss'],
    imports: [
        HeaderV2Component,
        RouterOutlet,
        RouterLink,
        NgOptimizedImage,
    ]
})
export class WrapperComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
