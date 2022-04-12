import { FieldValue } from '@angular/fire/firestore';

export enum CardSet {
  DEFAULT = 'DEFAULT',
  FIBONACCI = 'FIBONACCI',
  HALF = 'HALF',
  LARGE = 'LARGE',
  TSHIRT = 'TSHIRT',
}

export const CustomCardSet = 'CUSTOM';
export type CardSetOrCustom = CardSet | typeof CustomCardSet;
export interface Room {
  id: string;
  roomId: string;
  members: Member[];
  rounds: { [roundNumber: number]: Round };
  currentRound?: number;
  isOpen: boolean;
  createdAt: FieldValue;
  cardSet?: CardSetOrCustom;
  customCardSetValue?: CardSetValue;
}

export interface Round {
  id: string;
  topic: string;
  started_at: FieldValue;
  finished_at: FieldValue;
  estimates: { [memberId: string]: number };
  show_results: boolean;
  notes?: Notes;
}

export interface Notes {
  note: string;
  editedBy: Member | null;
}

export interface Member {
  id: string;
  name: string;
}

export interface RoomData {
  roomId: string;
  memberId: string;
  createdAt: string;
}

export interface RoundStatistics {
  average: number;
  highestVote: {
    value: number;
    voter: string;
  };
  lowestVote: {
    value: number;
    voter: string;
  };
  elapsed?: string;
}

export type CardSetValue = {
  values: { [value: number]: string };
  title: string;
  icon: string;
  key: CardSetOrCustom;
};

export const CARD_SETS: { [cardSetKey in CardSet]: CardSetValue } = {
  [CardSet.DEFAULT]: {
    values: { 0: '0', 0.5: '0.5', 1: '1', 2: '2', 3: '3', 5: '5' },
    title: 'Default Cards',
    icon: 'looks_one',
    key: CardSet.DEFAULT,
  },
  [CardSet.FIBONACCI]: {
    values: { 1: '1', 2: '2', 3: '3', 5: '5', 8: '8', 13: '13' },
    title: 'Fibonacci Cards',
    icon: 'looks_two',
    key: CardSet.FIBONACCI,
  },
  [CardSet.HALF]: {
    values: { 0.5: '0.5', 1: '1', 1.5: '1.5', 2: '2', 2.5: '2.5', 3: '3' },
    title: 'Half Cards',
    icon: 'looks_3',
    key: CardSet.HALF,
  },
  [CardSet.LARGE]: {
    values: { 0: '0', 20: '20', 40: '40', 60: '60', 80: '80', 100: '100' },
    title: 'Large Cards',
    icon: 'looks_4',
    key: CardSet.LARGE,
  },
  [CardSet.TSHIRT]: {
    values: { 1: 'XS', 2: 'S', 3: 'M', 4: 'L', 5: 'XL', 6: 'XXL' },
    title: 'T-Shirt Sizing',
    icon: 'looks_5',
    key: CardSet.TSHIRT,
  },
};

export function getRoundedDisplayValue(value: number, cardSet: CardSetValue) {
  const values = Object.values(cardSet.values);
  const isNumericCard = values.every((value) => isNumeric(value));
  console.log(value, isNumericCard)
  if (isNumericCard) {
    return value;
  }

  const roundedValue = Math.round(value);
  return cardSet.values[roundedValue] ?? '-';
}

export function isNumeric(str: any) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    !isNaN(+str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}
