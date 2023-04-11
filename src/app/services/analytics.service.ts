import { Injectable } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import {
  CardSetOrCustom,
  RoomPermissionId,
  SubscriptionResult,
} from '../types';

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

  logTogglePassOption(showPassOption: boolean) {
    logEvent(this.analytics, 'toggled_pass_option', {
      show_pass_option: showPassOption,
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

  logClickedSignUpWithGoogle(
    location: 'history' | 'profile-modal' | 'sign-in-dialog'
  ) {
    logEvent(this.analytics, 'clicked_sign_up_with_google', {
      buttonLocation: location,
    });
  }

  logClickedSignIn(location: 'join' | 'create') {
    logEvent(this.analytics, 'clicked_sign_in_with_google', {
      buttonLocation: location,
    });
  }

  logClickedStartTimer() {
    logEvent(this.analytics, 'clicked_start_timer');
  }

  logClickedStopTimer() {
    logEvent(this.analytics, 'clicked_stop_timer');
  }

  logClickedResetTimer() {
    logEvent(this.analytics, 'clicked_reset_timer');
  }

  logClickedAddTimeToTimer() {
    logEvent(this.analytics, 'clicked_add_time_to_timer');
  }

  logClickedOpenRoomConfigurationModal() {
    logEvent(this.analytics, 'clicked_open_room_configuration_modal');
  }

  logClickedCreateAccount(where: string) {
    logEvent(this.analytics, 'clicked_create_account', { location: where });
  }

  logClickedSavePermissions(updatedPermission: RoomPermissionId) {
    logEvent(this.analytics, 'updated_permissions', {
      permissionId: updatedPermission,
    });
  }

  logClickedManageSubscription(arg0: string) {
    logEvent(this.analytics, 'clicked_manage_subscription', { location: arg0 });
  }

  logClickedJoinRoomWithPassword() {
    logEvent(this.analytics, 'clicked_join_room_with_password');
  }

  logSubscriptionResultReceived(result: SubscriptionResult) {
    logEvent(this.analytics, 'subscription_result_received', { result });
  }

  logClickedInviteOrganizationMember() {
    logEvent(this.analytics, 'clicked_invite_organization_member');
  }

  logClickedRemoveLogo() {
    logEvent(this.analytics, 'clicked_remove_organization_logo');
  }

  logClickedUploadLogo() {
    logEvent(this.analytics, 'clicked_upload_organization_logo');
  }

  logClickedUpdateOrganization() {
    logEvent(this.analytics, 'clicked_update_organization');
  }

  logClickedGetStartedOrganization() {
    logEvent(this.analytics, 'clicked_get_started_organization');
  }

  logClickedReportAnIssue(arg0: string) {
    logEvent(this.analytics, 'clicked_report_an_issue', { location: arg0 });
  }

  logClickedLearnMorePremium(arg0: string) {
    logEvent(this.analytics, 'clicked_learn_more_premium', { location: arg0 });
  }

  logClickedSubscribeToPremium(arg0: string) {
    logEvent(this.analytics, 'clicked_subscribe_to_premium', {
      location: arg0,
    });
  }

  logClickedOpenOrganizationModal(arg0: string) {
    logEvent(this.analytics, 'clicked_open_organization_modal', {
      location: arg0,
    });
  }

  logToggleOrganizationProtection() {
    logEvent(this.analytics, 'clicked_toggle_organization_protection');
  }

  logToggledPassword() {
    logEvent(this.analytics, 'clicked_toggle_password_protection');
  }

  logClickedSaveRoomPassword() {
    logEvent(this.analytics, 'clicked_save_room_password');
  }

  logSelectedJiraIssueFromDropdown() {
    logEvent(this.analytics, 'selected_jira_issue_from_dropdown');
  }

  logClickedStartJiraAuth() {
    logEvent(this.analytics, 'clicked_start_jira_auth');
  }

  logClickedViewOnJiraButton() {
    logEvent(this.analytics, 'clicked_view_on_jira');
  }

  logClickedCopySummaryToClipboard() {
    logEvent(this.analytics, 'clicked_copy_summary_to_clipboard');
  }

  logClickedGenerateSummary() {
    logEvent(this.analytics, 'clicked_generate_summary');
  }

  logClickedSummarize() {
    logEvent(this.analytics, 'clicked_summarize');
  }
}
