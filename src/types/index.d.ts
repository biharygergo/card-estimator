

// Original file: live_sharing.v2.types.d.ts

/**
 * Represents that a failure event occurred before, during, or after a live
 * sharing activity.
 * FAILURE_EVENT_UNSPECIFIED: Failure event that's not specified in the
 * predefined types.
 *
 * FAILURE_USER_INSUFFICIENT_TIER: Failure due to the user membership tier not
 * having sufficient privileges. For example, user not having a premium
 * membership for the Live Sharing Application.
 *
 * FAILURE_USER_UNKNOWN: Failure due to user sign-in or a related failure.
 *
 * FAILURE_USER_CANCELLED: Failure due to cancellation of the operation by the
 * user.
 *
 * FAILURE_USER_UNAUTHORIZED: Failure due to the user being in the wrong locale
 * or age group, etc., effectively being an unauthorized user for the live
 * sharing activity.
 *
 * FAILURE_APP_GENERIC_ERROR: Failure due to a generic error with the Live
 * Sharing Application.
 *
 * FAILURE_APP_NETWORK_CONNECTIVITY: Failure due to a network connectivity issue
 * between the Live Sharing Application and its servers.
 *
 * FAILURE_APP_STARTUP: Failure due to an error in starting the Live Sharing
 * Application.
 */
export type LiveSharingFailureEventType =
  | 'FAILURE_EVENT_UNSPECIFIED'
  | 'FAILURE_USER_INSUFFICIENT_TIER'
  | 'FAILURE_USER_UNKNOWN'
  | 'FAILURE_USER_CANCELLED'
  | 'FAILURE_USER_UNAUTHORIZED'
  | 'FAILURE_APP_GENERIC_ERROR'
  | 'FAILURE_APP_NETWORK_CONNECTIVITY'
  | 'FAILURE_APP_STARTUP';



/**
 * Binary-encoded state for CoDoing experiences.
 */
export interface CoDoingState {
  bytes: Uint8Array;
}


/**
 * Host-provided set of base configuration options.
 */
export interface CoActivityDelegate {
  /**
   * User-suitable string describing the CoActivity.
   */
  activityTitle: string;
}


/**
 * Host-provided set of callbacks required to operate a CoDoing experience.
 */
export interface CoDoingDelegate extends CoActivityDelegate {
  /**
   * Callback for state updates broadcast by other participants in the meeting.
   *
   * Note: This isn't called in response to local changes.
   *
   * @param update the state update to be applied.
   */
  onCoDoingStateChanged(newState: CoDoingState): void;
}



/**
 * Client-constructed CoDoing experience with hooks for hosts to notify
 * of state updates.
 */
export interface CoDoingClient {
  /**
   * Broadcasts state to all other current participants, and is the default
   * state for any participant until some other state is broadcast.
   *
   * **Note:** This shared state is eventually consistent across
   * participants. For predictable behavior, this binary state should be
   * complete, not partial, as the Live Sharing SDK doesn't provide
   * guarantees around the delivery of individual messages -- only eventual
   * consistency.
   *
   * **Note:** In a race condition where two participants call this method
   * simultaneously, the Live Sharing SDK selects a canonical winning
   * update. The losing update might or might not be applied to participants,
   * but the winning update is always applied later.
   */
  broadcastStateUpdate(newState: CoDoingState): void;
}



/**
 * Current PlaybackState for CoWatching experiences.
 */
export type PlaybackState =
  | 'INVALID'
  | 'BUFFERING'
  | 'PLAY'
  | 'PAUSE'
  | 'ENDED';

/**
 * State for CoWatching experiences.
 */
export interface CoWatchingState {
  /**
   * The identifier for the media being played.
   *
   * Note: The actual format only matters to the co-watching app.
   */
  mediaId: string;

  /** The current position of the media playout, in seconds. */
  mediaPlayoutPosition: number;

  /** The current playout rate, where {@code 1.0} is normal speed. */
  mediaPlayoutRate: number;

  /** The current player state, such as Paused, Playing, Buffering, etc. */
  playbackState: PlaybackState;
}



type CoWatchingQueryResponse = Pick<CoWatchingState, 'mediaPlayoutPosition'>;


/**
 * Host-provided set of callbacks required to operate a CoWatching experience.
 */
export interface CoWatchingDelegate extends CoActivityDelegate {
  /**
   * Apply the supplied state to media playout, up to and including switching
   * to a new media stream if the mediaId changes.
   *
   * @param state the new state to be applied to the player.
   */
  onCoWatchingStateChanged(newState: CoWatchingState): void;

  /**
   * Return the current state of the local media playout. This is called
   * regularly so it should be written to be performant.
   *
   * @return a {@link CoWatchingState} describing the current state.
   */
  onCoWatchingStateQuery(): CoWatchingQueryResponse;
}



/**
 * Client-constructed CoWatching experience with hooks for hosts to manage the
 * state.
 */
export interface CoWatchingClient {
  /**
   * Notify Meet that the user has switched media so Meet can pass that along
   * to other users.
   *
   * @param mediaTitle The title of the media switched to. This title is
   *     reflected in the Meet UI when other users are considering connecting to
   *     the co-watching session.
   * @param mediaId The string URI of the media switched to.
   * @param mediaPlayoutPosition The position at which the media began playout.
   */
  notifySwitchedToMedia(
    mediaTitle: string,
    mediaId: string,
    mediaPlayoutPosition: number,
  ): void;

  /**
   * Notify Meet that the user has paused or unpaused the playback of media, so
   * Meet can mirror that action for other users.
   *
   * @param paused The new paused or unpaused state.
   */
  notifyPauseState(paused: boolean, mediaPlayoutPosition: number): void;

  /**
   * Notify Meet that the user has sought the playback point of the media, so
   * Meet can mirror that action for other users.
   *
   * @param mediaPlayoutPosition The timestamp that the user sought.
   */
  notifySeekToTimestamp(mediaPlayoutPosition: number): void;

  /**
   * Notify Meet that the user updated the playout rate of the media to a new
   * value (for example, 1.25x).
   *
   * @param rate The rate at which the media is now being played.
   * @param mediaPlayoutPosition The position at which the media began playout
   */
  notifyPlayoutRate(rate: number, mediaPlayoutPosition: number): void;

  /**
   * Notify Meet that the media isn't ready to be played due to
   * buffering, a prior media switch, seeking, or normal network
   * congestion.
   *
   * @param mediaPlayoutPosition The timestamp at which the media is paused or
   *     waiting for buffering to complete.
   */
  notifyBuffering(mediaPlayoutPosition: number): void;

  /**
   * Notify Meet that the buffering is complete and the media is now ready to
   * play, starting at the supplied timestamp.
   *
   * @param mediaPlayoutPosition The timestamp at which the media is buffered
   *     and is now ready to play.
   */
  notifyReady(mediaPlayoutPosition: number): void;
}



// Original file: index.types.d.ts


/**
 * Parameters to retrieve the add-on session.
 */
export interface AddonSessionOptions {
  /**
   * The cloud project number of the add-on.
   */
  cloudProjectNumber: string;
}

/**
 * The main entry point for accessing Meet add-on functionality. Available
 * globally under window.meet.addon.
 */
export interface MeetAddon {
  /**
   * Returns the {@link
   * https://developers.google.com/meet/add-ons/reference/websdk/addon_sdk.frametype
   * | FrameType} in which the add-on is running in.
   */
  getFrameType: () => FrameType;

  /**
   * Creates an add-on session.
   */
  createAddonSession: (options: AddonSessionOptions) => Promise<AddonSession>;
}

declare global {
  export interface Window {
    meet: {addon: MeetAddon};
  }
}


// Original file: client.types.d.ts


/**
 * Information about the meeting in which the add-on is running.
 */
export interface MeetingInfo {
  /**
   * The MeetingId for the current meeting, which can be used to retrieve
   * meeting information from the Meet API. The MeetingId is a globally unique
   * identifier for the meeting.
   */
  meetingId: string;
}

/**
 * The different places in Meet that the iframed add-on can be running in.
 *
 * SIDE_PANEL: The iframed add-on running in the Meet side panel.
 * MAIN_STAGE: The iframed add-on running as a tile in the Meet main stage.
 */
export type FrameType = 'SIDE_PANEL' | 'MAIN_STAGE';

/**
 * The reasons that the frame was opened.
 *
 * OPEN_ADDON: The frame was opened because the addon was selected in the
 * activities panel.
 * START_COLLABORATION: The frame was opened because the local user started a
 * collaboration.
 * JOIN_COLLABORATION: The frame was opened because the user joined a
 * collaboration started by another user.
 */
export type FrameOpenReason =
  | 'UNKNOWN'
  | 'OPEN_ADDON'
  | 'START_COLLABORATION'
  | 'JOIN_COLLABORATION';

/**
 * A client-initiated message sent from one add-on frame to another.
 */
export interface FrameToFrameMessage {
  /**
   * The add-on frame that sent the message.
   */
  originator: FrameType;
  /**
   * The message payload. Value set by the add-on running in the frame specified
   * by the originator field.
   */
  payload: string;
}

/**
 * All of the callbacks that add-ons can attach to.
 */
export interface AddonCallbacks {
  /**
   * Message sent by the add-on running in one frame to the add-on running in
   * another frame.
   */
  readonly frameToFrameMessage?: (message: FrameToFrameMessage) => void;
  /**
   * Callback that is triggered when the user initiates a collaboration in meet.
   */
  readonly userInitiatedCollaboration?: () => void;
}

/**
 * Starting state of the add-on when the participant accepts the invitation to
 * collaborate.
 */
export interface CollaborationStartingState {
  /**
   * The URL that the main stage will open for users joining the collaboration.
   */
  mainStageUrl?: string;

  /**
   * The URL that the side panel will open for users joining the collaboration.
   */
  sidePanelUrl?: string;

  /**
   * Data internal to the add-on that it can use to initialize itself. Useful
   * for communicating application-specific state to users joining the
   * collaboration that cannot be stored in the URLs.
   */
  additionalData?: string;
}

/**
 * The client object that an add-on uses to communicate with Meet web.
 */
export interface MeetAddonClient {
  /**
   * Retrieves information about the meeting in which the add-on is running.
   */
  getMeetingInfo(): Promise<MeetingInfo>;
  /**
   * Retrieves information about the initial state of the add-on when the
   * participant accepts the invitation to collaborate.
   */
  getCollaborationStartingState(): Promise<CollaborationStartingState>;
  /**
   * Sets or updates information about the initial state of the add-on that is
   * used when the participant accepts the invitation to collaborate.
   */
  setCollaborationStartingState(
    collaborationStartingState: CollaborationStartingState,
  ): Promise<void>;
  /**
   * Clears the information about the initial state of the add-on used in
   * collaboration.
   */
  clearCollaborationStartingState(): Promise<void>;
  /**
   * Provides access to the {@link
   * https://developers.google.com/meet/add-ons/reference/websdk/addon_sdk.addoncallbacks
   * | AddonCallbacks} that the add-on can utilize.
   */
  on<T extends keyof AddonCallbacks>(
    eventId: T,
    eventHandler: AddonCallbacks[T],
  ): void;

  /**
   * Retrieves information about the Meet platform in which the add-on is
   * running.
   */
  getMeetPlatformInfo(): Promise<MeetPlatformInfo>;
  /**
   * Retrieves what action caused the add-on frame to be opened.
   */
  getFrameOpenReason(): Promise<FrameOpenReason>;

  /** Retrieves the meeting's current recording status. */
  getCurrentMeetingRecordingStatus(): Promise<RecordingStatus>;
}

/**
 * The MeetAddonClient for the side panel component of an add-on.
 */
export interface MeetSidePanelClient extends MeetAddonClient {
  /**
   * Sends a message from the main stage add-on iframe to the side panel add-on
   * iframe. The add-on running in the side panel iframe can react to this
   * message using the {@link
   * https://developers.google.com/meet/add-ons/reference/websdk/addon_sdk.addoncallbacks.frametoframemessage
   * | frameToFrameMessage} add-on callback (see {@link AddonCallbacks}).
   */
  notifyMainStage(payload: string): Promise<void>;
}

/**
 * The MeetAddonClient for the main stage component of an add-on.
 */
export interface MeetMainStageClient extends MeetAddonClient {
  /**
   * Sends a message from the side panel add-on iframe to the main stage add-on
   * iframe. The add-on running in the main stage iframe can react to this
   * message using the {@link
   * https://developers.google.com/meet/add-ons/reference/websdk/addon_sdk.addoncallbacks.frametoframemessage
   * | frameToFrameMessage} add-on callback.
   */
  notifySidePanel(payload: string): Promise<void>;
  /**
   * Closes the side panel iframe. Note that side panel add-on state isn't
   * retained within Meet when the method is called. If the side panel iframe
   * is opened again, for instance using a call to {@link
   * https://developers.google.com/meet/add-ons/reference/websdk/addon_sdk.meetmainstageclient.loadsidepanel
   * | loadSidePanel}, the side panel iframe source URL is set to its original
   * value from the {@link
   * https://developers.google.com/meet/add-ons/guides/build-add-on#manifest |
   * add-on manifest}. It's up to the add-on to persist any add-on state in the
   * add-on backend before this method is called.
   */
  unloadSidePanel(): Promise<void>;
  /**
   * Opens the side panel iframe with the iframe src set to the side panel
   * URL from the {@link
   * https://developers.google.com/meet/add-ons/guides/build-add-on#manifest |
   * add-on manifest}.
   */
  loadSidePanel(): Promise<void>;
}

/**
 * The AddonSession interface. Used to interact with Meet.
 */
export interface AddonSession {
  /** Creates a MainStageClient. */
  createMainStageClient(): Promise<MeetMainStageClient>;
  /** Creates a SidePanelClient. */
  createSidePanelClient(): Promise<MeetSidePanelClient>;
  /** Creates a CoDoingClient. */
  createCoDoingClient(coDoingDelegate: CoDoingDelegate): Promise<CoDoingClient>;
  /** Creates a CoWatchingClient. */
  createCoWatchingClient(
    coWatchingDelegate: CoWatchingDelegate,
  ): Promise<CoWatchingClient>;
}

/**
 * Information about the Meet platform in which the add-on is running.
 */
export interface MeetPlatformInfo {
  /**
   * Whether the meeting is running on Meet Rooms hardware.
   */
  isMeetHardware: boolean;
}

/** Current recording status for the meeting.  */
export type RecordingStatus =
  | 'RECORDING_STARTING'
  | 'RECORDING_IN_PROGRESS'
  | 'NOT_RECORDING'
  | 'RECORDING_STATUS_UNKNOWN';
