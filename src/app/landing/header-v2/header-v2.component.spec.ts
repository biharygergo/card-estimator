import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderV2Component } from './header-v2.component';

describe('HeaderV2Component', () => {
  let component: HeaderV2Component;
  let fixture: ComponentFixture<HeaderV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeaderV2Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
