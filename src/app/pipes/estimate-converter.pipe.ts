import { Pipe, PipeTransform } from '@angular/core';
import {
  CardSet,
  CardSetValue,
  CARD_SETS,
  CustomCardSet,
  getRoundedDisplayValue,
  Room,
} from '../types';

@Pipe({
  name: 'estimateConverter',
})
export class EstimateConverterPipe implements PipeTransform {
  transform(
    value: number | string | null,
    activeCardSetValue: CardSetValue,
    transformType: 'exact' | 'rounded'
  ): string | number {
    if (value === null) {
      console.error('Invalid option null (pass) given to pipe.');
      return 0;
    }

    if (transformType === 'exact') {
      return activeCardSetValue.values[+value] ?? +value;
    } else {
      return getRoundedDisplayValue(+value, activeCardSetValue);
    }
  }
}

export function getRoomCardSetValue(room: Room) {
  const cardSet = room.cardSet || CardSet.DEFAULT;
  if (cardSet === CustomCardSet) {
    return room.customCardSetValue ?? CARD_SETS[CardSet.DEFAULT];
  }

  return CARD_SETS[cardSet];
}
