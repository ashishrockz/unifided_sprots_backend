/**
 * @file    modules/matches/match.model.ts
 * @desc    Match schema — teams, innings, ball-by-ball scoring, toss.
 *          The most complex schema in the system.
 */
import { Schema, model, Document, Types } from "mongoose";
import { MATCH_STATUSES, PLAYER_ROLES, BAT_STATUSES, INN_STATUSES, TOSS_CALLS, TOSS_DECISIONS } from "../../constants";

export interface IMatch extends Document {
  _id: Types.ObjectId; title: string; sportType: Types.ObjectId; sportSlug: string;
  creator: Types.ObjectId; status: string; teams: any[]; guestPlayers: any[];
  matchConfig: Record<string, any>; toss?: any; innings: any[];
  winner?: number; result?: any; awards: any[];
  abandonReason?: string; abandonedBy?: string;
  lastActivityAt: Date; inactivityLimit: number;
  lastBallSnapshot?: any;
  startedAt?: Date; completedAt?: Date;
}

const ballS = new Schema({ ballNumber: Number, deliveryNumber: Number, batsmanId: Schema.Types.ObjectId, bowlerId: Schema.Types.ObjectId, runs: Number, extras: { type: { type: String }, runs: Number }, totalRuns: Number, isLegal: Boolean, isWicket: Boolean, isBoundary: Boolean, isDotBall: Boolean, wicket: { type: { type: String }, dismissedBatsman: Schema.Types.ObjectId, fielder: Schema.Types.ObjectId }, commentary: String, timestamp: { type: Date, default: Date.now } }, { _id: false });
const overS = new Schema({ overNumber: Number, bowlerId: Schema.Types.ObjectId, bowlerName: String, runs: Number, wickets: Number, extras: Number, isMaiden: Boolean, balls: [ballS], runRateAfterOver: Number, cumulativeRuns: Number, cumulativeWickets: Number }, { _id: false });
const batS = new Schema({ playerId: Schema.Types.ObjectId, playerName: String, role: String, isCaptain: Boolean, isKeeper: Boolean, battingPosition: Number, status: { type: String, enum: BAT_STATUSES, default: "yet_to_bat" }, runs: { type: Number, default: 0 }, ballsFaced: { type: Number, default: 0 }, fours: { type: Number, default: 0 }, sixes: { type: Number, default: 0 }, strikeRate: { type: Number, default: 0 }, dotBalls: { type: Number, default: 0 }, singles: { type: Number, default: 0 }, doubles: { type: Number, default: 0 }, triples: { type: Number, default: 0 }, dismissal: { type: { type: String }, bowler: Schema.Types.ObjectId, fielder: Schema.Types.ObjectId, description: String }, isOnStrike: Boolean, milestones: { reached30: { type: Boolean, default: false }, reached50: { type: Boolean, default: false }, reached100: { type: Boolean, default: false } } }, { _id: false });
const bowlS = new Schema({ playerId: Schema.Types.ObjectId, playerName: String, role: String, isCaptain: Boolean, overs: { type: Number, default: 0 }, ballsBowled: { type: Number, default: 0 }, maidens: { type: Number, default: 0 }, runsConceded: { type: Number, default: 0 }, wickets: { type: Number, default: 0 }, economy: { type: Number, default: 0 }, dotBalls: { type: Number, default: 0 }, wides: { type: Number, default: 0 }, noBalls: { type: Number, default: 0 }, foursConceded: { type: Number, default: 0 }, sixesConceded: { type: Number, default: 0 }, isCurrentBowler: Boolean }, { _id: false });
const innS = new Schema({ inningsNumber: Number, battingTeamIndex: Number, bowlingTeamIndex: Number, status: { type: String, enum: INN_STATUSES, default: "not_started" }, totalRuns: { type: Number, default: 0 }, totalWickets: { type: Number, default: 0 }, totalOvers: { type: Number, default: 0 }, totalBalls: { type: Number, default: 0 }, target: Number, extras: { wides: { type: Number, default: 0 }, noBalls: { type: Number, default: 0 }, byes: { type: Number, default: 0 }, legByes: { type: Number, default: 0 }, total: { type: Number, default: 0 } }, currentRunRate: { type: Number, default: 0 }, requiredRunRate: Number, projectedScore: Number, batting: [batS], bowling: [bowlS], overs: [overS], fallOfWickets: [{ wicketNumber: Number, runs: Number, overs: Number, batsman: Schema.Types.ObjectId, batsmanName: String, batsmanRuns: Number, bowler: Schema.Types.ObjectId, dismissalType: String }], partnerships: [{ partnershipNumber: Number, batsman1: Schema.Types.Mixed, batsman2: Schema.Types.Mixed, totalRuns: { type: Number, default: 0 }, totalBalls: { type: Number, default: 0 }, isActive: Boolean }], currentBatsman: Schema.Types.ObjectId, currentNonStriker: Schema.Types.ObjectId, currentBowler: Schema.Types.ObjectId, lastBowler: Schema.Types.ObjectId, completedAt: Date, completionReason: String }, { _id: false });
const teamPlayerS = new Schema({ user: { type: Schema.Types.ObjectId, ref: "User", required: true }, role: { type: String, enum: PLAYER_ROLES }, battingPosition: Number, isGuest: { type: Boolean, default: false }, guestName: String }, { _id: false });
const teamS = new Schema({ name: { type: String, required: true }, captain: { type: Schema.Types.ObjectId, ref: "User" }, wicketkeeper: { type: Schema.Types.ObjectId, ref: "User" }, players: [teamPlayerS], battingOrder: [Schema.Types.ObjectId], bowlingOrder: [Schema.Types.ObjectId] }, { _id: false });

const ms = new Schema<IMatch>({
  title: { type: String, required: true, trim: true }, sportType: { type: Schema.Types.ObjectId, ref: "SportType", required: true },
  sportSlug: { type: String, required: true }, creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: MATCH_STATUSES, default: "draft" }, teams: [teamS],
  guestPlayers: [{ name: String, addedBy: Schema.Types.ObjectId }],
  matchConfig: { type: Schema.Types.Mixed, required: true },
  toss: { calledBy: Schema.Types.ObjectId, call: { type: String, enum: TOSS_CALLS }, result: { type: String, enum: TOSS_CALLS }, wonBy: Number, decision: { type: String, enum: TOSS_DECISIONS } },
  innings: [innS], winner: Number, result: { type: { type: String }, margin: Number, description: String },
  awards: [{ type: { type: String }, player: Schema.Types.ObjectId, stats: Schema.Types.Mixed }],
  abandonReason: String, abandonedBy: { type: String, enum: ["admin", "creator", "system", null] },
  lastActivityAt: { type: Date, default: Date.now }, inactivityLimit: { type: Number, default: 30 },
  lastBallSnapshot: { type: Schema.Types.Mixed, default: null },
  startedAt: Date, completedAt: Date,
}, { timestamps: true });
ms.index({ sportSlug: 1, status: 1 }); ms.index({ creator: 1 }); ms.index({ "teams.players.user": 1, status: 1 });
export const Match = model<IMatch>("Match", ms);
