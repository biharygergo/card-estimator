import { FieldValue, Timestamp } from '@angular/fire/firestore';

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
  subscriptionMetadata?: SubscriptionMetadata;
  relatedRecurringMeetingLinkId?: string;
  isAsyncVotingEnabled?: boolean;
  isAnonymousVotingEnabled?: boolean;
}

export interface Round {
  id: string;
  topic: string;
  richTopic?: RichTopic | null;
  started_at: Timestamp;
  finished_at: Timestamp | null;
  estimates: { [memberId: string]: number | null };
  show_results: boolean;
  notes?: Notes;
  majorityOverride?: number | null;
}

export interface Notes {
  note: string;
  editedBy: Pick<Member, 'id' | 'name'> | null;
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

export type Platform = 'zoom' | 'webex' | 'teams' | 'meet' | 'web';

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  type: MemberType;
  status: MemberStatus;
  platform?: Platform;
  lastActiveHeartbeat?: Timestamp;
}

export interface MemberStat {
  lastHeartbeatAt: Timestamp;
}

export interface MemberStats {
  [memberId: string]: MemberStat;
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

export type SavedCardSetValue = CardSetValue & {
  id: string;
  createdAt: FieldValue;
  organizationId: string | null;
};

export type UserProfileMap = { [userId: string]: UserProfile | undefined };

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
  CAN_OVERRIDE_MAJORITY_VOTE = 'CAN_OVERRIDE_MAJORITY_VOTE',
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
  {
    id: RoomPermissionId.CAN_OVERRIDE_MAJORITY_VOTE,
    label: 'Override majority vote',
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
    value: [UserRole.ROOM_MEMBER_ESTIMATOR],
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
  [RoomPermissionId.CAN_OVERRIDE_MAJORITY_VOTE]: {
    permissionId: RoomPermissionId.CAN_OVERRIDE_MAJORITY_VOTE,
    value: [UserRole.ROOM_CREATOR],
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
  organizationProtection: string;
}

export interface SubscriptionMetadata {
  createdWithPlan: 'premium' | 'basic' | 'credit' | 'paid-credit';
  createdWithOrganization?: string | null;
}

export const DEFAULT_ROOM_CONFIGURATION: RoomConfiguration = {
  permissions: DEFAULT_PERMISSIONS,
};

export type InvitationData = {
  id?: string;
  invitedById: string;
  invitationEmail: string;
  organizationId: string;
  createdAt: FieldValue;
  emailStatus: 'pending' | 'success' | 'failure';
  status: 'pending' | 'accepted';
  acceptedAt?: FieldValue;
};

export interface Organization {
  id: string;
  name: string;
  createdAt: FieldValue;
  createdById: string;
  memberIds: string[];
  logoUrl: string;
  activePlan: 'basic' | 'premium';
}

export enum SubscriptionResult {
  SUCCESS = 'success',
  CANCEL = 'cancel',
}

export interface JiraIssue {
  summary: string;
  description: string | null;
  status?: string;
  assignee?: string;
  id: string;
  key: string;
  url: string;
}

export interface RichTopic {
  provider: 'jira' | 'linear';
  description: string;
  summary: string;
  status?: string;
  assignee?: string;
  key: string;
  url: string;
  id?: string;
}

export type JiraResource = {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
  active?: boolean;
  storyPointsCustomFieldId?: string;
};

export type JiraIntegration = {
  provider: 'jira';
  createdAt: FieldValue;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  id: string;
  jiraResources: JiraResource[];
};

export type LinearIntegration = {
  provider: 'linear';
  createdAt: FieldValue;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  id: string;
};

export interface RoomSummary {
  summary: string;
  createdAt: FieldValue;
  createdById: string;
}

export interface MeteredUsage {
  createdAt: FieldValue;
  type: 'chatgpt-query';
  subscription: 'premium' | 'basic';
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

export type RecurringMeetingLink = {
  id: string;
  createdById: string;
  organizationId?: string;
  createdAt: FieldValue;
  isEnabled: boolean;
  frequencyDays: number;
  name: string;
};

export type RecurringMeetingLinkCreatedRoom = {
  createdAt: Timestamp;
  roomId: string;
};

export function getRoundedDisplayValue(value: number, cardSet: CardSetValue) {
  if (isNumericCardSet(cardSet)) {
    return Math.round(value * 100) / 100;
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

export interface UserPreference {
  lastJoinedRoom?: {
    roomId: string;
    heartbeatAt: FieldValue;
  };
  feedbackFormLastShown?: FieldValue;
  updatedPricingModalShown?: boolean;
  aloneInRoomModalShown?: boolean;
  selectedIssueIntegrationProvider?: 'jira' | 'linear';
  activeOrganizationId?: string;
}

export interface Credit {
  id: string;
  assignedToUserId: string;
  bundleId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
  usedForRoomId?: string;
  isPaidCredit?: boolean;
  organizationId?: string;
}

export interface CreditBundle {
  id: string;
  userId: string;
  paymentId: string | null;
  createdAt: Timestamp;
  name: BundleName;
  displayName?: string;
  creditCount: number;
  expiresAt: Timestamp | null;
}

export interface BundleWithCredits extends CreditBundle {
  credits: Credit[];
}

export enum BundleName {
  WELCOME_BUNDLE_STANDARD = 'WELCOME_BUNDLE_STANDARD',
  WELCOME_BUNDLE_EXISTING_USER = 'WELCOME_BUNDLE_EXISTING_USER',
  SMALL_BUNDLE = 'SMALL_BUNDLE',
  LARGE_BUNDLE = 'LARGE_BUNDLE',
  MEGA_BUNDLE = 'MEGA_BUNDLE',
  MONTHLY_BUNDLE = 'MONTHLY_BUNDLE',
  ORGANIZATION_BUNDLE = 'ORGANIZATION_BUNDLE',
}

export function getBundleTitle(bundleName: BundleName) {
  switch (bundleName) {
    case BundleName.LARGE_BUNDLE:
      return 'Large Bundle';
    case BundleName.SMALL_BUNDLE:
      return 'Small Bundle';
    case BundleName.MEGA_BUNDLE:
      return 'Mega Bundle';
    case BundleName.WELCOME_BUNDLE_EXISTING_USER:
      return 'Welcome Bundle for Existing Users';
    case BundleName.WELCOME_BUNDLE_STANDARD:
      return 'Welcome Bundle for New Users';
    default:
      return bundleName;
  }
}

export interface IssueApiFilter {
  fieldName: string;
  value: string | number;
  comparator: 'contains' | 'is';
}
