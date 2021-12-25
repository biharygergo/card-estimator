import { Pipe, PipeTransform } from '@angular/core';
import { CardSet, CARD_SETS } from '../types';

@Pipe({
  name: 'estimateConverter',
})
export class EstimateConverterPipe implements PipeTransform {
  transform(
    value: number | string,
    activeCardSet: CardSet,
    transformType: 'exact' | 'rounded'
  ): string | number {
    if (transformType === 'exact') {
      return CARD_SETS[activeCardSet].values[+value];
    } else {
      return CARD_SETS[activeCardSet].getRoundedDisplayValue(+value);
    }
  }
}
