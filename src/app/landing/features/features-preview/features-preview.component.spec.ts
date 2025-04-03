import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturesPreviewComponent } from './features-preview.component';

describe('FeaturesPreviewComponent', () => {
  let component: FeaturesPreviewComponent;
  let fixture: ComponentFixture<FeaturesPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
