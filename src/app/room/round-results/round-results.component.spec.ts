import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundResultsComponent } from './round-results.component';

describe('RoundResultsComponent', () => {
  let component: RoundResultsComponent;
  let fixture: ComponentFixture<RoundResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [RoundResultsComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(RoundResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
