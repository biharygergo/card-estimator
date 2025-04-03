import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureTabComponent } from './configure-tab.component';

describe('ConfigureTabComponent', () => {
  let component: ConfigureTabComponent;
  let fixture: ComponentFixture<ConfigureTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfigureTabComponent],
    });
    fixture = TestBed.createComponent(ConfigureTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
