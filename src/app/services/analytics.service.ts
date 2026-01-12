import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import {
  CardSetOrCustom,
  RoomPermissionId,
  SubscriptionResult,
} from '../types';
import { isPlatformBrowser } from '@angular/common';
import posthog from 'posthog-js';

export type ZoomAppCtaLocation =
  | 'detail_page'
  | 'banner_landing'
  | 'banner_join';
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(
    private analytics: Analytics,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  private logEventInternal(eventName: string, params?: any) {
    try {
      if (isPlatformBrowser(this.platformId)) {
        logEvent(this.analytics, eventName, params);
        posthog.capture(eventName, params);

      }
    } catch (e) {
      console.error('Failed to log event to Analytics', e);
    }
  }

  logClickedStartPlanning() {
    this.logEventInternal('clicked_start_planning');
  }

  logFilledNameInput() {
    this.logEventInternal('filled_name_input');
  }

  logFilledRoomId() {
    this.logEventInternal('filled_room_id');
  }

  logAutoFilledRoomId() {
    this.logEventInternal('auto_filled_room_id');
  }

  logClickedJoinedRoom() {
    this.logEventInternal('clicked_join_room');
  }

  logClickedJoinLastRoom() {
    this.logEventInternal('clicked_join_last_room');
  }

  logClickedJoinAsObserver() {
    this.logEventInternal('clicked_join_as_observer');
  }

  logClickedCreateNewRoom() {
    this.logEventInternal('clicked_create_new_room');
  }

  logClickedNewRound() {
    this.logEventInternal('clicked_new_round');
  }

  logClickedAddRoundConfirmed() {
    this.logEventInternal('clicked_add_round_confirmed');
  }

  logClickedNextRound() {
    this.logEventInternal('clicked_next_round');
  }

  logClickedSetActiveRound() {
    this.logEventInternal('clicked_set_active_round');
  }

  logClickedShowResults() {
    this.logEventInternal('clicked_show_results');
  }

  logClickedTopicName() {
    this.logEventInternal('clicked_topic_name');
  }

  logClickedShareRoom(fromScreen: 'main' | 'alone_modal') {
    this.logEventInternal('clicked_share_room', { from_screen: fromScreen });
  }

  logClickedUnits() {
    this.logEventInternal('clicked_units');
  }

  logClickedEnableSound() {
    this.logEventInternal('clicked_enable_sound');
  }

  logClickedDisableSound() {
    this.logEventInternal('clicked_disable_sound');
  }

  logShowedAloneInRoomModal() {
    this.logEventInternal('showed_alone_in_room_modal');
  }

  logClickedContinueAlone() {
    this.logEventInternal('clicked_continue_alone');
  }

  logClickedVoteOption() {
    this.logEventInternal('clicked_vote_option');
  }

  logClickedLeaveRoom() {
    this.logEventInternal('clicked_leave_room');
  }

  logClickedGithubLink() {
    this.logEventInternal('clicked_github_link');
  }

  logClickedDownloadResults() {
    this.logEventInternal('clicked_download_results');
  }

  logClickedReVote() {
    this.logEventInternal('clicked_revote');
  }

  logFocusedNotesField() {
    this.logEventInternal('focused_notes_field');
  }

  logClickedSetCustomCards() {
    this.logEventInternal('clicked_set_custom_cards');
  }

  logClickedSaveCustomCards() {
    this.logEventInternal('clicked_save_custom_cards');
  }

  logSelectedCardSet(cardSet: CardSetOrCustom) {
    this.logEventInternal('selected_custom_cards', {
      card_set: cardSet,
    });
  }

  logTogglePassOption(showPassOption: boolean) {
    this.logEventInternal('toggled_pass_option', {
      show_pass_option: showPassOption,
    });
  }

  logToggleAsyncVote(asyncEnabled: boolean) {
    this.logEventInternal('toggled_async_vote', {
      async_enabled: asyncEnabled,
    });
  }

  logToggleAnonymousVote(enabled: boolean) {
    this.logEventInternal('toggled_anonymous_vote', {
      anonym_enabled: enabled,
    });
  }

  logClickedEditAvatar(source: 'profile_icon' | 'snackbar') {
    this.logEventInternal('clicked_edit_avatar', { source });
  }

  logSelectedAvatar(avatarUrl: string) {
    this.logEventInternal('selected_avatar', {
      avatar_url: avatarUrl,
    });
  }

  logClickedRandomizeAvatars() {
    this.logEventInternal('clicked_randomize_avatars');
  }

  logClickedInstallZoomApp(location: ZoomAppCtaLocation) {
    this.logEventInternal('clicked_install_zoom_app', {
      bannerLocation: location,
    });
  }

  logClickedLearnMoreZoomApp(location: ZoomAppCtaLocation) {
    this.logEventInternal('clicked_learn_more_zoom_app', {
      bannerLocation: location,
    });
  }

  logClickedCloseZoomAppBanner(location: ZoomAppCtaLocation) {
    this.logEventInternal('clicked_close_zoom_app_banner', {
      bannerLocation: location,
    });
  }

  logClickedSignUpWithGoogle(
    location: 'history' | 'profile-modal' | 'sign-in-dialog'
  ) {
    this.logEventInternal('clicked_sign_up_with_google', {
      buttonLocation: location,
    });
  }

  logClickedSignIn(location: 'join' | 'create') {
    this.logEventInternal('clicked_sign_in_with_google', {
      buttonLocation: location,
    });
  }

  logClickedStartTimer() {
    this.logEventInternal('clicked_start_timer');
  }

  logClickedStopTimer() {
    this.logEventInternal('clicked_stop_timer');
  }

  logClickedResetTimer() {
    this.logEventInternal('clicked_reset_timer');
  }

  logClickedAddTimeToTimer() {
    this.logEventInternal('clicked_add_time_to_timer');
  }

  logClickedOpenRoomConfigurationModal() {
    this.logEventInternal('clicked_open_room_configuration_modal');
  }

  logClickedCreateAccount(where: string) {
    this.logEventInternal('clicked_create_account', { location: where });
  }

  logClickedSavePermissions(updatedPermission: RoomPermissionId) {
    this.logEventInternal('updated_permissions', {
      permissionId: updatedPermission,
    });
  }

  logClickedManageSubscription(arg0: string) {
    this.logEventInternal('clicked_manage_subscription', { location: arg0 });
  }

  logClickedJoinRoomWithPassword() {
    this.logEventInternal('clicked_join_room_with_password');
  }

  logSubscriptionResultReceived(result: SubscriptionResult) {
    this.logEventInternal('subscription_result_received', { result });
  }

  logClickedInviteOrganizationMember() {
    this.logEventInternal('clicked_invite_organization_member');
  }

  logClickedRemoveLogo() {
    this.logEventInternal('clicked_remove_organization_logo');
  }

  logClickedUploadLogo() {
    this.logEventInternal('clicked_upload_organization_logo');
  }

  logClickedUpdateOrganization() {
    this.logEventInternal('clicked_update_organization');
  }

  logClickedGetStartedOrganization() {
    this.logEventInternal('clicked_get_started_organization');
  }

  logClickedReportAnIssue(arg0: string) {
    this.logEventInternal('clicked_report_an_issue', { location: arg0 });
  }

  logClickedLearnMorePremium(arg0: string) {
    this.logEventInternal('clicked_learn_more_premium', { location: arg0 });
  }

  logClickedSubscribeToPremium(arg0: string) {
    this.logEventInternal('clicked_subscribe_to_premium', {
      location: arg0,
    });
  }

  logClickedBuyBundle(arg0: string) {
    this.logEventInternal('clicked_buy_bundle', {
      location: arg0,
    });
  }

  logClickedOpenOrganizationModal(arg0: string) {
    this.logEventInternal('clicked_open_organization_modal', {
      location: arg0,
    });
  }

  logToggleOrganizationProtection() {
    this.logEventInternal('clicked_toggle_organization_protection');
  }

  logToggledPassword() {
    this.logEventInternal('clicked_toggle_password_protection');
  }

  logClickedSaveRoomPassword() {
    this.logEventInternal('clicked_save_room_password');
  }

  logSelectedJiraIssueFromDropdown() {
    this.logEventInternal('selected_jira_issue_from_dropdown');
  }

  logClickedStartJiraAuth() {
    this.logEventInternal('clicked_start_jira_auth');
  }

  logClickedViewOnJiraButton() {
    this.logEventInternal('clicked_view_on_jira');
  }

  logClickedCopySummaryToClipboard() {
    this.logEventInternal('clicked_copy_summary_to_clipboard');
  }

  logClickedGenerateSummary() {
    this.logEventInternal('clicked_generate_summary');
  }

  logClickedSummarize() {
    this.logEventInternal('clicked_summarize');
  }

  logToggledReactions() {
    this.logEventInternal('toggled_reactions');
  }

  logClickedReaction(reactionId: string) {
    this.logEventInternal('clicked_reaction', { reactionId });
  }

  logClickedHideAd() {
    this.logEventInternal('clicked_hide_ad');
  }

  logClickedPremiumDeal() {
    this.logEventInternal('clicked_premium_deal');
  }

  logClickedChangeLocalRound() {
    this.logEventInternal('clicked_change_local_round');
  }

  logSharedToStage() {
    this.logEventInternal('shared_room_to_meeting_stage');
  }

  logClickedLinearAuth() {
    this.logEventInternal('clicked_start_linear_auth');
  }

  logClickedBatchImportTopicsModal() {
    this.logEventInternal('clicked_open_batch_import_modal');
  }

  logClickedBatchImportIssue() {
    this.logEventInternal('clicked_batch_import_issue');
  }

  logClickedImportBatchIssues() {
    this.logEventInternal('clicked_import_batch_issues');
  }

  logCompletedOnboarding() {
    this.logEventInternal('completed_onboarding');
  }

  logClickedNextOnboarding() {
    this.logEventInternal('clicked_next_onboarding');
  }

  logClickedBackOnboarding() {
    this.logEventInternal('clicked_back_onboarding');
  }

  logStartedOnboarding() {
    this.logEventInternal('started_onboarding');
  }

  logSkippedOnboarding() {
    this.logEventInternal('skipped_onboarding');
  }

  logCompletedMemberOnboarding() {
    this.logEventInternal('completed_member_onboarding');
  }

  logClickedBackMemberOnboarding() {
    this.logEventInternal('clicked_back_member_onboarding');
  }

  logClickedNextMemberOnboarding() {
    this.logEventInternal('clicked_next_member_onboarding');
  }

  logStartedMemberOnboarding() {
    this.logEventInternal('started_member_onboarding');
  }

  logSkippedMemberOnboarding() {
    this.logEventInternal('skipped_member_onboarding');
  }

  logToggleAutoReveal(arg0: boolean) {
    this.logEventInternal('toggled_auto_reveal', {
      auto_reveal_enabled: arg0,
    });
  }

  logToggleChangeVoteAfterReveal(arg0: boolean) {
    this.logEventInternal('toggled_change_vote_after_reveal', {
      change_vote_after_reveal_enabled: arg0,
    });
  }

  logClickedOpenReferralDialog(source: string) {
    this.logEventInternal('clicked_open_referral_dialog', { source });
  }
}
