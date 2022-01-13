import firebase from 'firebase/compat/app';

export enum CardSet {
    DEFAULT = 'DEFAULT',
    FIBONACCI = 'FIBONACCI',
    HALF = 'HALF',
    LARGE = 'LARGE',
    TSHIRT = 'TSHIRT',
  }
  export interface Room {
    id: string;
    roomId: string;
    members: Member[];
    rounds: { [roundNumber: number]: Round };
    isOpen: boolean;
    createdAt: firebase.firestore.Timestamp;
    cardSet?: CardSet;
  }
  
  export interface Round {
    id: string;
    topic: string;
    started_at: firebase.firestore.Timestamp;
    finished_at: firebase.firestore.Timestamp;
    estimates: { [memberId: string]: number };
    show_results: boolean;
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
    getRoundedDisplayValue: (value: number) => string | number;
  };
  
  const isBetween = (value: number, start: number, end: number): boolean =>
    value >= start && value < end;
  
  export const CARD_SETS: { [cardSetKey in CardSet]: CardSetValue } = {
    [CardSet.DEFAULT]: {
      values: { 0: '0', 0.5: '0.5', 1: '1', 2: '2', 3: '3', 5: '5' },
      title: 'Default Cards',
      icon: 'looks_one',
      getRoundedDisplayValue: (value) => value,
    },
    [CardSet.FIBONACCI]: {
      values: { 1: '1', 2: '2', 3: '3', 5: '5', 8: '8', 13: '13' },
      title: 'Fibonacci Cards',
      icon: 'looks_two',
      getRoundedDisplayValue: (value) => value,
    },
    [CardSet.HALF]: {
      values: { 0.5: '0.5', 1: '1', 1.5: '1.5', 2: '2', 2.5: '2.5', 3: '3' },
      title: 'Half Cards',
      icon: 'looks_3',
      getRoundedDisplayValue: (value) => value,
    },
    [CardSet.LARGE]: {
      values: { 0: '0', 20: '20', 40: '40', 60: '60', 80: '80', 100: '100' },
      title: 'Large Cards',
      icon: 'looks_4',
      getRoundedDisplayValue: (value) => value,
    },
    [CardSet.TSHIRT]: {
      values: { 1: 'XS', 2: 'S', 3: 'M', 4: 'L', 5: 'XL', 6: 'XXL' },
      title: 'T-Shirt Sizing',
      icon: 'looks_5',
      getRoundedDisplayValue: (value) => {
        if (isBetween(value, 1, 1.5)) {
          return 'XS';
        } else if (isBetween(value, 1.5, 2.5)) {
          return 'S';
        } else if (isBetween(value, 2.5, 3.5)) {
          return 'M';
        } else if (isBetween(value, 3.5, 4.5)) {
          return 'L';
        } else if (isBetween(value, 4.5, 5.5)) {
          return 'XL';
        } else if (isBetween(value, 5.5, 6.1)) {
          return 'XXL';
        } else {
          return '-';
        }
      },
    },
  };