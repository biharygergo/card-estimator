import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverrideMajorityVoteModalComponent } from './override-majority-vote-modal.component';

describe('OverrideMajorityVoteModalComponent', () => {
  let component: OverrideMajorityVoteModalComponent;
  let fixture: ComponentFixture<OverrideMajorityVoteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverrideMajorityVoteModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OverrideMajorityVoteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
