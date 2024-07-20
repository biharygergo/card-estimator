import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicEditorComponent } from './topic-editor.component';

describe('TopicEditorComponent', () => {
  let component: TopicEditorComponent;
  let fixture: ComponentFixture<TopicEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TopicEditorComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(TopicEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
