import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { DragDropDirective } from './drag-drop.directive';

describe('DragDropDirective', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({});
    const sanitizer = TestBed.inject(DomSanitizer);
    const directive = new DragDropDirective(sanitizer);
    expect(directive).toBeTruthy();
  });
});
