import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureJiraIntegrationModalComponent } from './configure-jira-integration-modal.component';

describe('ConfigureJiraIntegrationModalComponent', () => {
  let component: ConfigureJiraIntegrationModalComponent;
  let fixture: ComponentFixture<ConfigureJiraIntegrationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigureJiraIntegrationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureJiraIntegrationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
