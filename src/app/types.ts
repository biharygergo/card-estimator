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

export enum TimerState {
  STOPPED = 'stopped',
  INIT = 'init',
  ACTIVE = 'active',
}

export interface Timer {
  initialCountdownLength: number;
  countdownLength: number;
  extraSecondsAdded: number;
  startedAt: FieldValue | null;
  state: TimerState;
}

export interface Room {
  id: string;
  roomId: string;
  members: Member[];
  rounds: { [roundNumber: number]: Round };
  currentRound?: number;
  isOpen: boolean;
  createdAt: FieldValue;
  cardSet?: CardSetOrCustom;
  showPassOption?: boolean;
  customCardSetValue?: CardSetValue;
  createdById: string;
  memberIds: string[];
  timer?: Timer;
  configuration?: RoomConfiguration;
}

export interface Round {
  id: string;
  topic: string;
  started_at: FieldValue;
  finished_at: FieldValue;
  estimates: { [memberId: string]: number | null };
  show_results: boolean;
  notes?: Notes;
}

export interface Notes {
  note: string;
  editedBy: Member | null;
}

export enum MemberType {
  OBSERVER = 'OBSERVER',
  ESTIMATOR = 'ESTIMATOR',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  LEFT_ROOM = 'LEFT_ROOM',
  REMOVED_FROM_ROOM = 'REMOVED_FROM_ROOM',
}

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  type: MemberType;
  status: MemberStatus;
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
  consensus: { value: number; isConsensus: boolean };
}

export type CardSetValue = {
  values: { [value: number]: string };
  title: string;
  icon: string;
  key: CardSetOrCustom;
};

export type UserProfileMap = { [userId: string]: UserProfile };

export type UserProfile = {
  id: string;
  displayName: string;
  createdAt: FieldValue;
};

export type UserDetails = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  createdAt: FieldValue;
};

export enum UserRole {
  ROOM_MEMBER_ESTIMATOR = 'ROOM_MEMBER_ESTIMATOR',
  ROOM_MEMBER_OBSERVER = 'ROOM_MEMBER_OBSERVER',
  ROOM_CREATOR = 'ROOM_CREATOR',
}

export enum RoomPermissionId {
  CAN_VOTE = 'CAN_VOTE',
  CAN_EDIT_TOPIC = 'CAN_EDIT_TOPIC',
  CAN_CREATE_ROUND = 'CAN_CREATE_ROUND',
  CAN_TAKE_NOTES = 'CAN_TAKE_NOTES',
  CAN_REVEAL_RESULTS = 'CAN_REVEAL_RESULTS',
  CAN_VIEW_VELOCITY = 'CAN_VIEW_VELOCITY',
  CAN_DOWNLOAD_RESULTS = 'CAN_DOWNLOAD_RESULTS',
  CAN_CHANGE_CARD_SETS = 'CAN_CHANGE_CARD_SETS',
  CAN_SET_TIMER = 'CAN_SET_TIMER',
}

export interface RoomPermission {
  id: RoomPermissionId;
  label: string;
}

export interface RoomPermissionValue {
  permissionId: string;
  value: Array<UserRole>;
}

export interface PermissionsMap {
  [permissionId: string]: RoomPermissionValue;
}

export const PERMISSIONS_CATALOG: RoomPermission[] = [
  {
    id: RoomPermissionId.CAN_VOTE,
    label: 'Vote on topics',
  },
  {
    id: RoomPermissionId.CAN_EDIT_TOPIC,
    label: 'Edit topics',
  },
  {
    id: RoomPermissionId.CAN_CREATE_ROUND,
    label: 'Create rounds',
  },
  {
    id: RoomPermissionId.CAN_TAKE_NOTES,
    label: 'Take notes',
  },
  {
    id: RoomPermissionId.CAN_REVEAL_RESULTS,
    label: 'Reveal results',
  },
  {
    id: RoomPermissionId.CAN_VIEW_VELOCITY,
    label: 'View velocity',
  },
  {
    id: RoomPermissionId.CAN_DOWNLOAD_RESULTS,
    label: 'Download results',
  },
  {
    id: RoomPermissionId.CAN_CHANGE_CARD_SETS,
    label: 'Modify card sets',
  },
  {
    id: RoomPermissionId.CAN_SET_TIMER,
    label: 'Set the timer',
  },
];

export const PERMISSIONS_CATALOG_MAP: {
  [permissionId in RoomPermissionId]: RoomPermission;
} = PERMISSIONS_CATALOG.reduce((acc, curr) => {
  acc[curr.id] = curr;
  return acc;
}, {} as any);

const ALL_ROLES_ALLOWED = [
  UserRole.ROOM_CREATOR,
  UserRole.ROOM_MEMBER_ESTIMATOR,
  UserRole.ROOM_MEMBER_OBSERVER,
];

export const DEFAULT_PERMISSIONS: PermissionsMap = {
  [RoomPermissionId.CAN_VOTE]: {
    permissionId: RoomPermissionId.CAN_VOTE,
    value: [UserRole.ROOM_CREATOR, UserRole.ROOM_MEMBER_ESTIMATOR],
  },
  [RoomPermissionId.CAN_EDIT_TOPIC]: {
    permissionId: RoomPermissionId.CAN_EDIT_TOPIC,
    value: ALL_ROLES_ALLOWED,
  },
  [RoomPermissionId.CAN_CREATE_ROUND]: {
    permissionId: RoomPermissionId.CAN_CREATE_ROUND,
    value: ALL_ROLES_ALLOWED,
  },
  [RoomPermissionId.CAN_TAKE_NOTES]: {
    permissionId: RoomPermissionId.CAN_TAKE_NOTES,
    value: ALL_ROLES_ALLOWED,
  },
  [RoomPermissionId.CAN_REVEAL_RESULTS]: {
    permissionId: RoomPermissionId.CAN_REVEAL_RESULTS,
    value: ALL_ROLES_ALLOWED,
  },
  [RoomPermissionId.CAN_VIEW_VELOCITY]: {
    permissionId: RoomPermissionId.CAN_VIEW_VELOCITY,
    value: ALL_ROLES_ALLOWED,
  },
  [RoomPermissionId.CAN_DOWNLOAD_RESULTS]: {
    permissionId: RoomPermissionId.CAN_DOWNLOAD_RESULTS,
    value: ALL_ROLES_ALLOWED,
  },
  [RoomPermissionId.CAN_CHANGE_CARD_SETS]: {
    permissionId: RoomPermissionId.CAN_CHANGE_CARD_SETS,
    value: ALL_ROLES_ALLOWED,
  },
  [RoomPermissionId.CAN_SET_TIMER]: {
    permissionId: RoomPermissionId.CAN_SET_TIMER,
    value: ALL_ROLES_ALLOWED,
  },
};

/** Simplified permissions model to see if a user has a given permission or not */
export type UserPermissions = {
  [permissionId in RoomPermissionId]: boolean;
};

export interface RoomConfiguration {
  permissions?: PermissionsMap;
}

export interface AuthorizationMetadata {
  passwordProtectionEnabled: boolean;
}

export const DEFAULT_ROOM_CONFIGURATION: RoomConfiguration = {
  permissions: DEFAULT_PERMISSIONS,
};

export interface Organization {
  id: string;
  name: string;
  createdAt: FieldValue;
  createdById: string;
  memberIds: string[];
  logoUrl: string;
}

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
  if (isNumericCardSet(cardSet)) {
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

export function isNumericCardSet(cardSet: CardSetValue) {
  const values = Object.values(cardSet.values);
  return values.every((value) => isNumeric(value));
}
