import { Component, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../components/page-header/page-header.component';

@Component({
    selector: 'app-terms',
    templateUrl: './terms.component.html',
    styleUrls: ['./terms.component.scss'],
    standalone: true,
    imports: [PageHeaderComponent]
})
export class TermsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
