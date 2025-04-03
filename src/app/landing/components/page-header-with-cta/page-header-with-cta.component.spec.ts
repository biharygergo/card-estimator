import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageHeaderWithCtaComponent } from './page-header-with-cta.component';

describe('PageHeaderWithCtaComponent', () => {
  let component: PageHeaderWithCtaComponent;
  let fixture: ComponentFixture<PageHeaderWithCtaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderWithCtaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderWithCtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
