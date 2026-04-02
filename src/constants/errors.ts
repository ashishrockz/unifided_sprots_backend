/**
 * ─────────────────────────────────────────────────────────────────
 * @file    constants/errors.ts
 * @module  ErrorConstants
 * @desc    SINGLE SOURCE OF TRUTH for every error message, HTTP
 *          status code, and error code used across the backend.
 *          No module should hardcode error strings — import here.
 *
 * @usage   throw new AppError(ERRORS.AUTH.INVALID_TOKEN);
 * ─────────────────────────────────────────────────────────────────
 */

/** Immutable error definition — code, message, status */
export interface ErrorDef {
  readonly code: string;
  readonly message: string;
  readonly status: number;
}

/** Helper to create frozen error definitions */
const def = (code: string, message: string, status: number): ErrorDef =>
  Object.freeze({ code, message, status });

/* ════════════ AUTHENTICATION ════════════ */
export const AUTH_ERRORS = Object.freeze({
  MISSING_TOKEN:       def("AUTH_001", "Authorization header missing or malformed", 401),
  INVALID_TOKEN:       def("AUTH_002", "Access token is invalid", 401),
  EXPIRED_TOKEN:       def("AUTH_003", "Access token has expired", 401),
  INVALID_REFRESH:     def("AUTH_004", "Refresh token is invalid or revoked", 401),
  INVALID_CREDENTIALS: def("AUTH_005", "Invalid email or password", 401),
  INVALID_OTP:         def("AUTH_006", "Invalid or expired OTP", 401),
  FORBIDDEN:           def("AUTH_007", "Insufficient permissions", 403),
  ACCOUNT_BANNED:      def("AUTH_008", "Account has been suspended", 403),
});

/* ════════════ VALIDATION ════════════ */
export const VALIDATION_ERRORS = Object.freeze({
  INVALID_INPUT:     def("VAL_001", "Request validation failed", 400),
  INVALID_OBJECT_ID: def("VAL_002", "Invalid resource identifier", 400),
  MISSING_FIELD:     def("VAL_003", "Required field is missing", 400),
});

/* ════════════ RESOURCE NOT FOUND ════════════ */
export const RESOURCE_ERRORS = Object.freeze({
  USER_NOT_FOUND:           def("RES_001", "User not found", 404),
  SPORT_NOT_FOUND:          def("RES_002", "Sport type not found", 404),
  MATCH_NOT_FOUND:          def("RES_003", "Match not found", 404),
  FRIEND_REQUEST_NOT_FOUND: def("RES_004", "Friend request not found", 404),
  NOTIFICATION_NOT_FOUND:   def("RES_005", "Notification not found", 404),
  AD_NOT_FOUND:             def("RES_006", "Advertisement not found", 404),
  CONFIG_NOT_FOUND:         def("RES_007", "Configuration not found", 404),
  INNINGS_NOT_FOUND:        def("RES_008", "No active innings found", 404),
});

/* ════════════ CONFLICT / DUPLICATE ════════════ */
export const CONFLICT_ERRORS = Object.freeze({
  DUPLICATE_SLUG:    def("CON_001", "Sport with this slug already exists", 409),
  ALREADY_FRIENDS:   def("CON_002", "Already friends with this user", 409),
  REQUEST_PENDING:   def("CON_003", "Friend request already pending", 409),
  SELF_REQUEST:      def("CON_004", "Cannot send request to yourself", 409),
  PLAYER_IN_MATCH:   def("CON_005", "Player is already in an active match", 409),
  PLAYER_IN_TEAM:    def("CON_006", "Player is already in this match", 409),
});

/* ════════════ BUSINESS RULES ════════════ */
export const BUSINESS_ERRORS = Object.freeze({
  MATCH_NOT_LIVE:      def("BIZ_001", "Match is not in live status", 422),
  MATCH_ALREADY_ENDED: def("BIZ_002", "Match has already ended", 422),
  MATCH_NOT_READY:     def("BIZ_003", "Match is not ready for this action", 422),
  TOSS_NOT_DONE:       def("BIZ_004", "Toss must be completed first", 422),
  TOSS_ALREADY_DONE:   def("BIZ_005", "Toss has already been performed", 422),
  PLAYER_NOT_IN_TEAM:  def("BIZ_006", "Player does not belong to this team", 422),
  NOT_MATCH_CREATOR:   def("BIZ_007", "Only the match creator can do this", 403),
  AD_WATCH_REQUIRED:   def("BIZ_008", "Watch ad to unlock this action", 402),
  PLAN_REQUIRED:       def("BIZ_009", "Upgrade your plan to access this feature", 403),
  PLAN_EXPIRED:        def("BIZ_010", "Your subscription has expired", 403),
  SMS_LOGIN_DISABLED:  def("BIZ_011", "Mobile login is currently disabled", 403),
});

/* ════════════ ADMIN MANAGEMENT ════════════ */
export const ADMIN_ERRORS = Object.freeze({
  CANNOT_MODIFY_SELF:  def("ADM_001", "Cannot modify your own admin account", 422),
  ADMIN_NOT_FOUND:     def("ADM_002", "Admin user not found", 404),
  EMAIL_TAKEN:         def("ADM_003", "Email is already registered", 409),
  USERNAME_TAKEN:      def("ADM_004", "Username is already taken", 409),
});

/* ════════════ SYSTEM ════════════ */
export const SYSTEM_ERRORS = Object.freeze({
  INTERNAL:     def("SYS_001", "An unexpected error occurred", 500),
  MAINTENANCE:  def("SYS_002", "System is under maintenance", 503),
  RATE_LIMITED: def("SYS_003", "Too many requests — slow down", 429),
});

/** Unified export — all error groups */
export const ERRORS = Object.freeze({
  AUTH:       AUTH_ERRORS,
  VALIDATION: VALIDATION_ERRORS,
  RESOURCE:   RESOURCE_ERRORS,
  CONFLICT:   CONFLICT_ERRORS,
  BUSINESS:   BUSINESS_ERRORS,
  ADMIN:      ADMIN_ERRORS,
  SYSTEM:     SYSTEM_ERRORS,
});
