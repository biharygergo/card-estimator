import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicsSidebarComponent } from './topics-sidebar.component';

describe('TopicsSidebarComponent', () => {
  let component: TopicsSidebarComponent;
  let fixture: ComponentFixture<TopicsSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopicsSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicsSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
