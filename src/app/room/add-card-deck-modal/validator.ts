import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const CARD_DECK_IDEAL_SIZE = 6;
export const MAX_CARD_DECK_SIZE = 20;

export function cardDeckValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const cards = convertInputToCards(value);

    if (cards.length > MAX_CARD_DECK_SIZE) {
      return { cardDeckLength: { value: control.value } };
    }

    if (new Set(cards).size !== cards.length) {
      return { cardDeckDuplicates: { value: control.value } };
    }

    return null;
  };
}

export function convertInputToCards(input: string) {
  return (
    input
      ?.split(',')
      .map(item => item.replace(/ /g, ''))
      .filter(item => !!item) || []
  );
}
