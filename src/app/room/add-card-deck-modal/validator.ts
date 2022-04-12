import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function cardDeckValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const cards = convertInputToCards(value);

    if (cards.length > 6) {
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
      .map((item) => item.replace(/ /g, ''))
      .filter((item) => !!item) || []
  );
}
