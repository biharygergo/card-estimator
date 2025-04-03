import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCardDeckModalComponent } from './add-card-deck-modal.component';

describe('AddCardDeckModalComponent', () => {
  let component: AddCardDeckModalComponent;
  let fixture: ComponentFixture<AddCardDeckModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCardDeckModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCardDeckModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
