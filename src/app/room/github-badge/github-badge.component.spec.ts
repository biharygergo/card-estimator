import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubBadgeComponent } from './github-badge.component';

describe('GithubBadgeComponent', () => {
  let component: GithubBadgeComponent;
  let fixture: ComponentFixture<GithubBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GithubBadgeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GithubBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
