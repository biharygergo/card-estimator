import { Injectable } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private analytics: AngularFireAnalytics) {}

  logClickedStartPlanning() {
    this.analytics.logEvent('clicked_start_planning');
  }

  logFilledNameInput() {
    this.analytics.logEvent('filled_name_input');
  }

  logFilledRoomId() {
    this.analytics.logEvent('filled_room_id');
  }

  logAutoFilledRoomId() {
    this.analytics.logEvent('auto_filled_room_id');
  }

  logClickedJoinedRoom() {
    this.analytics.logEvent('clicked_join_room');
  }

  logClickedJoinLastRoom() {
    this.analytics.logEvent('clicked_join_last_room');
  }

  logClickedJoinAsObserver() {
    this.analytics.logEvent('clicked_join_as_observer');
  }

  logClickedCreateNewRoom() {
    this.analytics.logEvent('clicked_create_new_room');
  }

  logClickedNewRound() {
    this.analytics.logEvent('clicked_new_round');
  }

  logClickedShowResults() {
    this.analytics.logEvent('clicked_show_results');
  }

  logClickedTopicName() {
    this.analytics.logEvent('clicked_topic_name');
  }

  logClickedShareRoom(fromScreen: 'main' | 'alone_modal') {
    this.analytics.logEvent('clicked_share_room', { from_screen: fromScreen });
  }

  logClickedUnits() {
    this.analytics.logEvent('clicked_units');
  }

  logClickedEnableSound() {
    this.analytics.logEvent('clicked_enable_sound');
  }

  logClickedDisableSound() {
    this.analytics.logEvent('clicked_disable_sound');
  }

  logShowedAloneInRoomModal() {
    this.analytics.logEvent('showed_alone_in_room_modal');
  }

  logClickedContinueAlone() {
    this.analytics.logEvent('clicked_continue_alone');
  }

  logClickedVoteOption() {
    this.analytics.logEvent('clicked_vote_option');
  }

  logClickedLeaveRoom() {
    this.analytics.logEvent('clicked_leave_room');
  }

  logClickedGithubLink() {
    this.analytics.logEvent('clicked_github_link');
  }

  logClickedDownloadResults() {
    this.analytics.logEvent('clicked_download_results');
  }

  logClickedReVote() {
    this.analytics.logEvent('clicked_revote');
  }
}
