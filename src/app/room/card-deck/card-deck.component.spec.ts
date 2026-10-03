import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef, QueryList } from '@angular/core';

import { CardDeckComponent } from './card-deck.component';

describe('CardDeckComponent', () => {
  let component: CardDeckComponent;
  let fixture: ComponentFixture<CardDeckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDeckComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardDeckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// IMP-018: onCardKeydown() — keyboard navigation
// Tests run against the class method directly, no TestBed required.
// ---------------------------------------------------------------------------

function makeButton(disabled = false): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.disabled = disabled;
  btn.setAttribute('tabindex', '0');
  document.body.appendChild(btn);
  return btn;
}

function makeContainerRef(btn: HTMLButtonElement): ElementRef<HTMLDivElement> {
  const div = document.createElement('div');
  div.appendChild(btn);
  return { nativeElement: div } as ElementRef<HTMLDivElement>;
}

function buildQueryList(refs: ElementRef<HTMLDivElement>[]): QueryList<ElementRef<HTMLDivElement>> {
  const ql = new QueryList<ElementRef<HTMLDivElement>>();
  (ql as any)._results = refs;
  ql.toArray = () => refs;
  return ql;
}

function makeEvent(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}

describe('IMP-018: onCardKeydown keyboard navigation', () => {
  let buttons: HTMLButtonElement[];

  beforeEach(() => {
    document.body.querySelectorAll('button.kbnav-test').forEach(b => b.remove());
    buttons = [makeButton(), makeButton(), makeButton()];
    buttons.forEach(b => b.classList.add('kbnav-test'));
  });

  afterEach(() => {
    buttons.forEach(b => b.remove());
  });

  function buildComp(): CardDeckComponent {
    const comp = Object.create(CardDeckComponent.prototype) as CardDeckComponent;
    comp.cardContainers = buildQueryList(buttons.map(makeContainerRef));
    return comp;
  }

  it('ArrowRight moves focus to next button', () => {
    const comp = buildComp();
    buttons[0].focus();
    comp.onCardKeydown(makeEvent('ArrowRight'));
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ArrowRight wraps from last to first', () => {
    const comp = buildComp();
    buttons[2].focus();
    comp.onCardKeydown(makeEvent('ArrowRight'));
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ArrowDown behaves the same as ArrowRight', () => {
    const comp = buildComp();
    buttons[0].focus();
    comp.onCardKeydown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ArrowLeft moves focus to previous button', () => {
    const comp = buildComp();
    buttons[2].focus();
    comp.onCardKeydown(makeEvent('ArrowLeft'));
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ArrowLeft wraps from first to last', () => {
    const comp = buildComp();
    buttons[0].focus();
    comp.onCardKeydown(makeEvent('ArrowLeft'));
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('Home moves focus to first button', () => {
    const comp = buildComp();
    buttons[2].focus();
    comp.onCardKeydown(makeEvent('Home'));
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('End moves focus to last button', () => {
    const comp = buildComp();
    buttons[0].focus();
    comp.onCardKeydown(makeEvent('End'));
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('sets tabindex 0 on focused button and -1 on others', () => {
    const comp = buildComp();
    buttons[0].focus();
    comp.onCardKeydown(makeEvent('ArrowRight'));
    expect(buttons[1].getAttribute('tabindex')).toBe('0');
    expect(buttons[0].getAttribute('tabindex')).toBe('-1');
    expect(buttons[2].getAttribute('tabindex')).toBe('-1');
  });

  it('does nothing when focused element is not in the card list', () => {
    const comp = buildComp();
    // No card button focused — activeElement is body
    const spy = spyOn(buttons[0], 'focus');
    comp.onCardKeydown(makeEvent('ArrowRight'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('skips disabled buttons', () => {
    const comp = buildComp();
    buttons[1].disabled = true;
    comp.cardContainers = buildQueryList(buttons.map(makeContainerRef));
    buttons[0].focus();
    comp.onCardKeydown(makeEvent('ArrowRight'));
    expect(document.activeElement).toBe(buttons[2]);
  });
});
