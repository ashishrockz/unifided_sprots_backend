/**
 * ─────────────────────────────────────────────────────────────────
 * @file    constants/enums.ts
 * @desc    All enum constants. Mongoose schemas + Zod reference these.
 * ─────────────────────────────────────────────────────────────────
 */
export const USER_ROLES       = ["user", "admin"] as const;
export const ADMIN_ROLES      = ["super_admin", "sport_admin", "content_manager", "support_agent"] as const;
export const SUB_PLANS        = ["free", "pro", "max"] as const;
export const FR_STATUSES      = ["pending", "accepted", "rejected"] as const;
export const SCORING_TYPES    = ["ball_by_ball", "set_based", "point_based", "game_based"] as const;
export const MATCH_STATUSES   = ["draft", "team_setup", "toss", "live", "completed", "abandoned"] as const;
export const PLAYER_ROLES     = ["batsman", "bowler", "all_rounder", "wicketkeeper"] as const;
export const BAT_STATUSES     = ["yet_to_bat", "batting", "out", "retired_hurt", "not_out"] as const;
export const INN_STATUSES     = ["not_started", "in_progress", "completed"] as const;
export const WICKET_TYPES     = ["bowled","caught","caught_behind","caught_and_bowled","lbw","run_out","stumped","hit_wicket"] as const;
export const EXTRA_TYPES      = ["wide", "no_ball", "bye", "leg_bye"] as const;
export const TOSS_CALLS       = ["heads", "tails"] as const;
export const TOSS_DECISIONS   = ["bat", "bowl"] as const;
export const AD_SLOTS         = ["toss_coin","undo_action","splash_screen","maintenance_screen","match_banner","match_interstitial","home_banner","leaderboard_banner","post_match"] as const;
export const MEDIA_TYPES      = ["image", "video", "animation"] as const;
export const CONFIG_CATS      = ["general", "match", "ads", "features", "maintenance"] as const;
export const VISIBILITY       = ["public", "friends_only", "private"] as const;
export const NOTIFICATION_TYPES = [
  "match_completed", "added_to_match",
  "friend_request_received", "friend_request_accepted", "friend_request_rejected",
  "admin_announcement", "system",
] as const;
export const SOCKET_EVENTS    = Object.freeze({
  BALL_BOWLED: "match:ball:bowled", SCORE_UPDATED: "match:score:updated",
  WICKET: "match:wicket", OVER_COMPLETED: "match:over:completed",
  INNINGS_COMPLETED: "match:innings:completed", MATCH_COMPLETED: "match:completed",
  MATCH_ABANDONED: "match:abandoned", BALL_UNDONE: "match:ball:undone",
  CONFIG_UPDATED: "config:updated",
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_UNREAD: "notification:unread_count",
  MAINTENANCE_TOGGLED: "maintenance:toggled",
});
