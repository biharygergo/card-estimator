import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactionsRendererComponent } from './reactions-renderer.component';

describe('ReactionsRendererComponent', () => {
  let component: ReactionsRendererComponent;
  let fixture: ComponentFixture<ReactionsRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ReactionsRendererComponent]
});
    fixture = TestBed.createComponent(ReactionsRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
