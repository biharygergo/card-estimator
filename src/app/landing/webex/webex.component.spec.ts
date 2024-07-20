import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebexComponent } from './webex.component';

describe('WebexComponent', () => {
  let component: WebexComponent;
  let fixture: ComponentFixture<WebexComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [WebexComponent]
});
    fixture = TestBed.createComponent(WebexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
