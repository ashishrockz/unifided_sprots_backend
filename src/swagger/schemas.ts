/**
 * @file    swagger/schemas.ts
 * @desc    Reusable OpenAPI component schemas for all models.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     # ── Enums ──────────────────────────────────────────────
 *     UserRole:
 *       type: string
 *       enum: [user, admin]
 *
 *     AdminRole:
 *       type: string
 *       enum: [super_admin, sport_admin, content_manager, support_agent]
 *
 *     SubPlan:
 *       type: string
 *       enum: [free, pro, max]
 *
 *     MatchStatus:
 *       type: string
 *       enum: [draft, team_setup, toss, live, completed, abandoned]
 *
 *     PlayerRole:
 *       type: string
 *       enum: [batsman, bowler, all_rounder, wicketkeeper]
 *
 *     BatStatus:
 *       type: string
 *       enum: [yet_to_bat, batting, out, retired_hurt, not_out]
 *
 *     InningsStatus:
 *       type: string
 *       enum: [not_started, in_progress, completed]
 *
 *     WicketType:
 *       type: string
 *       enum: [bowled, caught, caught_behind, caught_and_bowled, lbw, run_out, stumped, hit_wicket]
 *
 *     ExtraType:
 *       type: string
 *       enum: [wide, no_ball, bye, leg_bye]
 *
 *     TossCall:
 *       type: string
 *       enum: [heads, tails]
 *
 *     TossDecision:
 *       type: string
 *       enum: [bat, bowl]
 *
 *     ScoringType:
 *       type: string
 *       enum: [ball_by_ball, set_based, point_based, game_based]
 *
 *     Visibility:
 *       type: string
 *       enum: [public, friends_only, private]
 *
 *     FriendRequestStatus:
 *       type: string
 *       enum: [pending, accepted, rejected]
 *
 *     AdSlot:
 *       type: string
 *       enum: [toss_coin, undo_action, splash_screen, maintenance_screen, match_banner, match_interstitial, home_banner, leaderboard_banner, post_match]
 *
 *     MediaType:
 *       type: string
 *       enum: [image, video, animation]
 *
 *     ConfigCategory:
 *       type: string
 *       enum: [general, match, ads, features, maintenance]
 *
 *     OrderType:
 *       type: string
 *       enum: [subscription, match_pack]
 *
 *     OrderStatus:
 *       type: string
 *       enum: [created, paid, failed, refunded]
 *
 *     SubscriptionStatus:
 *       type: string
 *       enum: [active, expired, cancelled]
 *
 *     PlanInterval:
 *       type: string
 *       enum: [monthly, yearly, lifetime]
 *
 *     # ── Common ─────────────────────────────────────────────
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         statusCode:
 *           type: integer
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 5
 *         hasNext:
 *           type: boolean
 *         hasPrev:
 *           type: boolean
 *
 *     # ── User ───────────────────────────────────────────────
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "665a1b2c3d4e5f6a7b8c9d0e"
 *         username:
 *           type: string
 *           example: "john_doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         mobile:
 *           type: string
 *           example: "+919876543210"
 *         avatar:
 *           type: string
 *           example: "https://cdn.example.com/avatar.jpg"
 *         displayName:
 *           type: string
 *           example: "John Doe"
 *         bio:
 *           type: string
 *           example: "Cricket enthusiast"
 *         country:
 *           type: string
 *           example: "IN"
 *         isActive:
 *           type: boolean
 *           example: true
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         adminRole:
 *           $ref: '#/components/schemas/AdminRole'
 *         subscription:
 *           type: object
 *           properties:
 *             plan:
 *               $ref: '#/components/schemas/SubPlan'
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *         profileVisibility:
 *           $ref: '#/components/schemas/Visibility'
 *         totalMatchesAllSports:
 *           type: integer
 *           example: 42
 *         totalWinsAllSports:
 *           type: integer
 *           example: 28
 *         totalMVPCount:
 *           type: integer
 *           example: 5
 *         totalPOMCount:
 *           type: integer
 *           example: 8
 *         friends:
 *           type: array
 *           items:
 *             type: string
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *         deviceInfo:
 *           type: object
 *           properties:
 *             platform:
 *               type: string
 *             deviceId:
 *               type: string
 *             appVersion:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         displayName:
 *           type: string
 *         avatar:
 *           type: string
 *         country:
 *           type: string
 *
 *     # ── Token Pair ─────────────────────────────────────────
 *     TokenPair:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIs..."
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIs..."
 *
 *     # ── Sport Type ─────────────────────────────────────────
 *     SportType:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: "Cricket"
 *         slug:
 *           type: string
 *           example: "cricket"
 *         icon:
 *           type: string
 *         logo:
 *           type: string
 *         splashVideo:
 *           type: string
 *         isActive:
 *           type: boolean
 *         rules:
 *           type: object
 *         uiConfig:
 *           type: object
 *         maxPlayersPerTeam:
 *           type: integer
 *           example: 11
 *         minPlayersPerTeam:
 *           type: integer
 *           example: 2
 *         scoringType:
 *           $ref: '#/components/schemas/ScoringType'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Friend Request ─────────────────────────────────────
 *     FriendRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         sender:
 *           $ref: '#/components/schemas/UserSummary'
 *         receiver:
 *           $ref: '#/components/schemas/UserSummary'
 *         status:
 *           $ref: '#/components/schemas/FriendRequestStatus'
 *         respondedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Match Config ───────────────────────────────────────
 *     MatchConfig:
 *       type: object
 *       properties:
 *         totalOvers:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           example: 20
 *         playersPerTeam:
 *           type: integer
 *           minimum: 1
 *           maximum: 15
 *           example: 11
 *         wideReBall:
 *           type: boolean
 *           example: true
 *         noBallReBall:
 *           type: boolean
 *           example: true
 *         noBallRuns:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *           example: 1
 *         wideRuns:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *           example: 1
 *         ballsPerOver:
 *           type: integer
 *           minimum: 4
 *           maximum: 8
 *           example: 6
 *         freeHitOnNoBall:
 *           type: boolean
 *           example: true
 *
 *     # ── Team Player ────────────────────────────────────────
 *     TeamPlayer:
 *       type: object
 *       properties:
 *         user:
 *           type: string
 *           description: User ID (populated in responses)
 *         role:
 *           $ref: '#/components/schemas/PlayerRole'
 *         battingPosition:
 *           type: integer
 *         isGuest:
 *           type: boolean
 *         guestName:
 *           type: string
 *
 *     # ── Team ───────────────────────────────────────────────
 *     Team:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Team 1"
 *         captain:
 *           type: string
 *           description: Player user ID
 *         wicketkeeper:
 *           type: string
 *           description: Player user ID
 *         players:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TeamPlayer'
 *         battingOrder:
 *           type: array
 *           items:
 *             type: string
 *         bowlingOrder:
 *           type: array
 *           items:
 *             type: string
 *
 *     # ── Toss ───────────────────────────────────────────────
 *     Toss:
 *       type: object
 *       properties:
 *         calledBy:
 *           type: string
 *           description: Team index (0 or 1)
 *         call:
 *           $ref: '#/components/schemas/TossCall'
 *         result:
 *           $ref: '#/components/schemas/TossCall'
 *         wonBy:
 *           type: integer
 *           description: "Team index that won (0 or 1)"
 *           example: 0
 *         decision:
 *           $ref: '#/components/schemas/TossDecision'
 *
 *     # ── Extras ─────────────────────────────────────────────
 *     Extras:
 *       type: object
 *       properties:
 *         wides:
 *           type: integer
 *           example: 3
 *         noBalls:
 *           type: integer
 *           example: 1
 *         byes:
 *           type: integer
 *           example: 0
 *         legByes:
 *           type: integer
 *           example: 2
 *         total:
 *           type: integer
 *           example: 6
 *
 *     # ── Batsman Card ───────────────────────────────────────
 *     BatsmanCard:
 *       type: object
 *       properties:
 *         playerId:
 *           type: string
 *         playerName:
 *           type: string
 *         role:
 *           type: string
 *         isCaptain:
 *           type: boolean
 *         isKeeper:
 *           type: boolean
 *         battingPosition:
 *           type: integer
 *         status:
 *           $ref: '#/components/schemas/BatStatus'
 *         runs:
 *           type: integer
 *         ballsFaced:
 *           type: integer
 *         fours:
 *           type: integer
 *         sixes:
 *           type: integer
 *         strikeRate:
 *           type: number
 *           format: float
 *         dotBalls:
 *           type: integer
 *         singles:
 *           type: integer
 *         doubles:
 *           type: integer
 *         triples:
 *           type: integer
 *         isOnStrike:
 *           type: boolean
 *         dismissal:
 *           type: object
 *           properties:
 *             type:
 *               $ref: '#/components/schemas/WicketType'
 *             bowler:
 *               type: string
 *             fielder:
 *               type: string
 *         milestones:
 *           type: array
 *           items:
 *             type: string
 *
 *     # ── Bowler Card ────────────────────────────────────────
 *     BowlerCard:
 *       type: object
 *       properties:
 *         playerId:
 *           type: string
 *         playerName:
 *           type: string
 *         role:
 *           type: string
 *         isCaptain:
 *           type: boolean
 *         overs:
 *           type: number
 *           format: float
 *         ballsBowled:
 *           type: integer
 *         maidens:
 *           type: integer
 *         runsConceded:
 *           type: integer
 *         wickets:
 *           type: integer
 *         economy:
 *           type: number
 *           format: float
 *         dotBalls:
 *           type: integer
 *         wides:
 *           type: integer
 *         noBalls:
 *           type: integer
 *         foursConceded:
 *           type: integer
 *         sixesConceded:
 *           type: integer
 *         isCurrentBowler:
 *           type: boolean
 *
 *     # ── Over ───────────────────────────────────────────────
 *     Over:
 *       type: object
 *       properties:
 *         overNumber:
 *           type: integer
 *         bowlerId:
 *           type: string
 *         bowlerName:
 *           type: string
 *         runs:
 *           type: integer
 *         wickets:
 *           type: integer
 *         extras:
 *           type: object
 *         isMaiden:
 *           type: boolean
 *         balls:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Ball'
 *         runRateAfterOver:
 *           type: number
 *           format: float
 *         cumulativeRuns:
 *           type: integer
 *         cumulativeWickets:
 *           type: integer
 *
 *     # ── Ball ───────────────────────────────────────────────
 *     Ball:
 *       type: object
 *       properties:
 *         ballNumber:
 *           type: integer
 *         deliveryNumber:
 *           type: integer
 *         batsmanId:
 *           type: string
 *         bowlerId:
 *           type: string
 *         runs:
 *           type: integer
 *         extras:
 *           type: object
 *           properties:
 *             type:
 *               $ref: '#/components/schemas/ExtraType'
 *             runs:
 *               type: integer
 *         totalRuns:
 *           type: integer
 *         isLegal:
 *           type: boolean
 *         isWicket:
 *           type: boolean
 *         isBoundary:
 *           type: boolean
 *         isDotBall:
 *           type: boolean
 *         wicket:
 *           type: object
 *           properties:
 *             type:
 *               $ref: '#/components/schemas/WicketType'
 *             dismissedBatsman:
 *               type: string
 *             fielder:
 *               type: string
 *         commentary:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *
 *     # ── Innings ────────────────────────────────────────────
 *     Innings:
 *       type: object
 *       properties:
 *         inningsNumber:
 *           type: integer
 *         battingTeamIndex:
 *           type: integer
 *         bowlingTeamIndex:
 *           type: integer
 *         status:
 *           $ref: '#/components/schemas/InningsStatus'
 *         totalRuns:
 *           type: integer
 *         totalWickets:
 *           type: integer
 *         totalOvers:
 *           type: number
 *           format: float
 *         totalBalls:
 *           type: integer
 *         target:
 *           type: integer
 *           nullable: true
 *         extras:
 *           $ref: '#/components/schemas/Extras'
 *         currentRunRate:
 *           type: number
 *           format: float
 *         requiredRunRate:
 *           type: number
 *           format: float
 *           nullable: true
 *         projectedScore:
 *           type: integer
 *           nullable: true
 *         batting:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BatsmanCard'
 *         bowling:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BowlerCard'
 *         overs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Over'
 *         fallOfWickets:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               wicketNumber:
 *                 type: integer
 *               runs:
 *                 type: integer
 *               overs:
 *                 type: number
 *               batsmanId:
 *                 type: string
 *         partnerships:
 *           type: array
 *           items:
 *             type: object
 *         currentBatsman:
 *           type: string
 *           nullable: true
 *         currentNonStriker:
 *           type: string
 *           nullable: true
 *         currentBowler:
 *           type: string
 *           nullable: true
 *         lastBowler:
 *           type: string
 *           nullable: true
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         completionReason:
 *           type: string
 *           nullable: true
 *
 *     # ── Match ──────────────────────────────────────────────
 *     Match:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *           example: "Weekend T20"
 *         sportType:
 *           type: string
 *         sportSlug:
 *           type: string
 *           example: "cricket"
 *         creator:
 *           $ref: '#/components/schemas/UserSummary'
 *         status:
 *           $ref: '#/components/schemas/MatchStatus'
 *         teams:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Team'
 *         guestPlayers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               addedBy:
 *                 type: string
 *         matchConfig:
 *           $ref: '#/components/schemas/MatchConfig'
 *         toss:
 *           $ref: '#/components/schemas/Toss'
 *         innings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Innings'
 *         winner:
 *           type: integer
 *           nullable: true
 *           description: "Winning team index (0 or 1)"
 *         result:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             margin:
 *               type: integer
 *             description:
 *               type: string
 *         awards:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               player:
 *                 type: string
 *               stats:
 *                 type: object
 *         abandonReason:
 *           type: string
 *           nullable: true
 *         abandonedBy:
 *           type: string
 *           enum: [admin, creator, system]
 *           nullable: true
 *         startedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     MatchSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         sportSlug:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/MatchStatus'
 *         creator:
 *           $ref: '#/components/schemas/UserSummary'
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Notification ───────────────────────────────────────
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         type:
 *           type: string
 *         title:
 *           type: string
 *         body:
 *           type: string
 *         data:
 *           type: object
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Advertisement ──────────────────────────────────────
 *     Advertisement:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *           example: "Sponsor Banner"
 *         slot:
 *           $ref: '#/components/schemas/AdSlot'
 *         mediaType:
 *           $ref: '#/components/schemas/MediaType'
 *         media:
 *           type: object
 *           properties:
 *             primary:
 *               type: string
 *             headsImage:
 *               type: string
 *             tailsImage:
 *               type: string
 *             sponsorLogo:
 *               type: string
 *         clickUrl:
 *           type: string
 *         duration:
 *           type: integer
 *         targetPlans:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubPlan'
 *         sportSlugs:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         priority:
 *           type: integer
 *         impressionCount:
 *           type: integer
 *         clickCount:
 *           type: integer
 *         startDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         endDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     # ── System Config ──────────────────────────────────────
 *     SystemConfig:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         key:
 *           type: string
 *         value:
 *           description: "Any JSON value"
 *         category:
 *           $ref: '#/components/schemas/ConfigCategory'
 *         description:
 *           type: string
 *         updatedBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Cricket Player Stats ───────────────────────────────
 *     CricketPlayerStats:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *         sportSlug:
 *           type: string
 *           example: "cricket"
 *         matchesPlayed:
 *           type: integer
 *         matchesWon:
 *           type: integer
 *         matchesLost:
 *           type: integer
 *         rankingPoints:
 *           type: integer
 *         recentForm:
 *           type: array
 *           items:
 *             type: string
 *         batting:
 *           type: object
 *           properties:
 *             innings:
 *               type: integer
 *             notOuts:
 *               type: integer
 *             totalRuns:
 *               type: integer
 *             ballsFaced:
 *               type: integer
 *             highestScore:
 *               type: integer
 *             average:
 *               type: number
 *             strikeRate:
 *               type: number
 *             fours:
 *               type: integer
 *             sixes:
 *               type: integer
 *             thirties:
 *               type: integer
 *             fifties:
 *               type: integer
 *             hundreds:
 *               type: integer
 *             ducks:
 *               type: integer
 *         bowling:
 *           type: object
 *           properties:
 *             innings:
 *               type: integer
 *             oversBowled:
 *               type: number
 *             ballsBowled:
 *               type: integer
 *             runsConceded:
 *               type: integer
 *             wickets:
 *               type: integer
 *             bestBowlingWickets:
 *               type: integer
 *             bestBowlingRuns:
 *               type: integer
 *             average:
 *               type: number
 *             economyRate:
 *               type: number
 *             strikeRate:
 *               type: number
 *             dotBalls:
 *               type: integer
 *             maidens:
 *               type: integer
 *             wides:
 *               type: integer
 *             noBalls:
 *               type: integer
 *             threeWicketHauls:
 *               type: integer
 *             fiveWicketHauls:
 *               type: integer
 *         fielding:
 *           type: object
 *           properties:
 *             catches:
 *               type: integer
 *             runOuts:
 *               type: integer
 *             directRunOuts:
 *               type: integer
 *             droppedCatches:
 *               type: integer
 *         wicketkeeping:
 *           type: object
 *           properties:
 *             matchesAsKeeper:
 *               type: integer
 *             catches:
 *               type: integer
 *             stumpings:
 *               type: integer
 *             totalDismissals:
 *               type: integer
 *             byes:
 *               type: integer
 *             legByes:
 *               type: integer
 *         dismissals:
 *           type: object
 *           properties:
 *             bowled:
 *               type: integer
 *             caught:
 *               type: integer
 *             caughtBehind:
 *               type: integer
 *             lbw:
 *               type: integer
 *             runOut:
 *               type: integer
 *             stumped:
 *               type: integer
 *             hitWicket:
 *               type: integer
 *             totalDismissals:
 *               type: integer
 *         awards:
 *           type: object
 *           properties:
 *             mvpCount:
 *               type: integer
 *             playerOfMatchCount:
 *               type: integer
 *             bestBatsmanAwards:
 *               type: integer
 *             bestBowlerAwards:
 *               type: integer
 *         records:
 *           type: object
 *           properties:
 *             highestScore:
 *               type: object
 *               properties:
 *                 runs:
 *                   type: integer
 *                 balls:
 *                   type: integer
 *                 matchId:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date-time
 *             bestBowling:
 *               type: object
 *               properties:
 *                 wickets:
 *                   type: integer
 *                 runs:
 *                   type: integer
 *                 matchId:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date-time
 *             longestWinStreak:
 *               type: integer
 *             currentWinStreak:
 *               type: integer
 *
 *     # ── Plan ───────────────────────────────────────────────
 *     Plan:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: "Pro Plan"
 *         slug:
 *           type: string
 *           example: "pro"
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           example: 299
 *         currency:
 *           type: string
 *           example: "INR"
 *         interval:
 *           $ref: '#/components/schemas/PlanInterval'
 *         isDefault:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 *         limits:
 *           type: object
 *           properties:
 *             matchesPerDay:
 *               type: integer
 *             matchesPerWeek:
 *               type: integer
 *             matchHistoryCount:
 *               type: integer
 *         features:
 *           type: object
 *           properties:
 *             adFree:
 *               type: boolean
 *             commentary:
 *               type: boolean
 *             analytics:
 *               type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Match Pack ─────────────────────────────────────────
 *     MatchPack:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         matchCount:
 *           type: integer
 *         price:
 *           type: number
 *         currency:
 *           type: string
 *           example: "INR"
 *         isActive:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Subscription ───────────────────────────────────────
 *     Subscription:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *         plan:
 *           $ref: '#/components/schemas/Plan'
 *         status:
 *           $ref: '#/components/schemas/SubscriptionStatus'
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         extraMatches:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Order ──────────────────────────────────────────────
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *         type:
 *           $ref: '#/components/schemas/OrderType'
 *         plan:
 *           $ref: '#/components/schemas/Plan'
 *         matchPack:
 *           $ref: '#/components/schemas/MatchPack'
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         razorpayOrderId:
 *           type: string
 *         razorpayPaymentId:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     # ── Audit Log ──────────────────────────────────────────
 *     AuditLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         actor:
 *           $ref: '#/components/schemas/UserSummary'
 *         actorRole:
 *           type: string
 *         action:
 *           type: string
 *         targetModel:
 *           type: string
 *         targetId:
 *           type: string
 *         details:
 *           type: object
 *         ip:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

export {};
