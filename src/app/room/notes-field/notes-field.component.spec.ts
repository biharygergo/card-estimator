import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesFieldComponent } from './notes-field.component';

describe('NotesFieldComponent', () => {
  let component: NotesFieldComponent;
  let fixture: ComponentFixture<NotesFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesFieldComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
