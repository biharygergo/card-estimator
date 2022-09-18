import { Injectable } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { CardSetOrCustom } from '../types';

export type ZoomAppCtaLocation =
  | 'detail_page'
  | 'banner_landing'
  | 'banner_join';
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private analytics: Analytics) {}

  logClickedStartPlanning() {
    logEvent(this.analytics, 'clicked_start_planning');
  }

  logFilledNameInput() {
    logEvent(this.analytics, 'filled_name_input');
  }

  logFilledRoomId() {
    logEvent(this.analytics, 'filled_room_id');
  }

  logAutoFilledRoomId() {
    logEvent(this.analytics, 'auto_filled_room_id');
  }

  logClickedJoinedRoom() {
    logEvent(this.analytics, 'clicked_join_room');
  }

  logClickedJoinLastRoom() {
    logEvent(this.analytics, 'clicked_join_last_room');
  }

  logClickedJoinAsObserver() {
    logEvent(this.analytics, 'clicked_join_as_observer');
  }

  logClickedCreateNewRoom() {
    logEvent(this.analytics, 'clicked_create_new_room');
  }

  logClickedNewRound() {
    logEvent(this.analytics, 'clicked_new_round');
  }

  logClickedAddRoundConfirmed() {
    logEvent(this.analytics, 'clicked_add_round_confirmed');
  }

  logClickedNextRound() {
    logEvent(this.analytics, 'clicked_next_round');
  }

  logClickedSetActiveRound() {
    logEvent(this.analytics, 'clicked_set_active_round');
  }

  logClickedShowResults() {
    logEvent(this.analytics, 'clicked_show_results');
  }

  logClickedTopicName() {
    logEvent(this.analytics, 'clicked_topic_name');
  }

  logClickedShareRoom(fromScreen: 'main' | 'alone_modal') {
    logEvent(this.analytics, 'clicked_share_room', { from_screen: fromScreen });
  }

  logClickedUnits() {
    logEvent(this.analytics, 'clicked_units');
  }

  logClickedEnableSound() {
    logEvent(this.analytics, 'clicked_enable_sound');
  }

  logClickedDisableSound() {
    logEvent(this.analytics, 'clicked_disable_sound');
  }

  logShowedAloneInRoomModal() {
    logEvent(this.analytics, 'showed_alone_in_room_modal');
  }

  logClickedContinueAlone() {
    logEvent(this.analytics, 'clicked_continue_alone');
  }

  logClickedVoteOption() {
    logEvent(this.analytics, 'clicked_vote_option');
  }

  logClickedLeaveRoom() {
    logEvent(this.analytics, 'clicked_leave_room');
  }

  logClickedGithubLink() {
    logEvent(this.analytics, 'clicked_github_link');
  }

  logClickedDownloadResults() {
    logEvent(this.analytics, 'clicked_download_results');
  }

  logClickedReVote() {
    logEvent(this.analytics, 'clicked_revote');
  }

  logFocusedNotesField() {
    logEvent(this.analytics, 'focused_notes_field');
  }

  logClickedSetCustomCards() {
    logEvent(this.analytics, 'clicked_set_custom_cards');
  }

  logClickedSaveCustomCards() {
    logEvent(this.analytics, 'clicked_save_custom_cards');
  }

  logSelectedCardSet(cardSet: CardSetOrCustom) {
    logEvent(this.analytics, 'selected_custom_cards', {
      card_set: cardSet,
    });
  }

  logClickedEditAvatar(source: 'profile_icon' | 'snackbar') {
    logEvent(this.analytics, 'clicked_edit_avatar', { source });
  }

  logSelectedAvatar(avatarUrl: string) {
    logEvent(this.analytics, 'selected_avatar', {
      avatar_url: avatarUrl,
    });
  }

  logClickedRandomizeAvatars() {
    logEvent(this.analytics, 'clicked_randomize_avatars');
  }

  logClickedInstallZoomApp(location: ZoomAppCtaLocation) {
    logEvent(this.analytics, 'clicked_install_zoom_app', {
      bannerLocation: location,
    });
  }

  logClickedLearnMoreZoomApp(location: ZoomAppCtaLocation) {
    logEvent(this.analytics, 'clicked_learn_more_zoom_app', {
      bannerLocation: location,
    });
  }

  logClickedCloseZoomAppBanner(location: ZoomAppCtaLocation) {
    logEvent(this.analytics, 'clicked_close_zoom_app_banner', {
      bannerLocation: location,
    });
  }
}
