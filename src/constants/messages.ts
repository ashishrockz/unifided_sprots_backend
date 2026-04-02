/**
 * ─────────────────────────────────────────────────────────────────
 * @file    constants/messages.ts
 * @desc    Centralized success messages. Controllers never hardcode strings.
 * ─────────────────────────────────────────────────────────────────
 */
export const MSG = Object.freeze({
  OTP_SENT:        "OTP sent successfully",
  AUTH_SUCCESS:    "Authentication successful",
  TOKEN_REFRESHED: "Token refreshed",
  LOGGED_OUT:      "Logged out",
  PROFILE_FETCHED: "Profile retrieved",

  CREATED:  (r: string) => `${r} created successfully`,
  UPDATED:  (r: string) => `${r} updated successfully`,
  DELETED:  (r: string) => `${r} deleted successfully`,
  FETCHED:  (r: string) => `${r} retrieved`,
  LIST:     (r: string) => `${r} list retrieved`,
  TOGGLED:  (r: string, on: boolean) => `${r} ${on ? "activated" : "deactivated"}`,

  FRIEND_SENT:       "Friend request sent",
  FRIEND_ACCEPTED:   "Friend request accepted",
  FRIEND_REJECTED:   "Friend request rejected",
  FRIEND_REMOVED:    "Friend removed",

  MATCH_STARTED:   "Match started",
  MATCH_ABANDONED: "Match abandoned",
  PLAYERS_ADDED:   "Players added",
  TEAM_VALIDATED:  "Team validation complete",
  TOSS_DONE:       "Toss completed",
  TOSS_DECISION:   "Decision recorded",
  BALL_RECORDED:   "Ball recorded",
  BALL_UNDONE:     "Last ball undone",

  MARKED_READ:     "Marked as read",
  ALL_READ:        "All marked as read",

  CONFIG_UPDATED:  "Configuration updated",
  MAINTENANCE:     (on: boolean) => `Maintenance ${on ? "enabled" : "disabled"}`,
  USER_BANNED:     "User suspended",
  USER_UNBANNED:   "User reinstated",
  AD_WATCHED:      "Ad verified — reward granted",

  ADMIN_CREATED:        "Admin account created",
  ADMIN_UPDATED:        "Admin role updated",
  ADMIN_ACTIVATED:      (on: boolean) => `Admin ${on ? "activated" : "deactivated"}`,
  SUBSCRIPTION_UPDATED: "Subscription updated",
  NOTIFICATION_SENT:    "Notification sent successfully",
  SMS_TOGGLED:          (on: boolean) => `SMS login ${on ? "enabled" : "disabled"}`,
});
