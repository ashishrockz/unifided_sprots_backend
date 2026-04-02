import { Schema, model, Document, Types } from "mongoose";
export interface ICricketPlayerStats extends Document { user: Types.ObjectId; sportSlug: string; matchesPlayed: number; matchesWon: number; matchesLost: number; rankingPoints: number; recentForm: string[]; batting: any; bowling: any; fielding: any; wicketkeeping: any; dismissals: any; awards: any; records: any; }
const n = (d = 0) => ({ type: Number, default: d });
const s = new Schema<ICricketPlayerStats>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }, sportSlug: { type: String, default: "cricket" },
  matchesPlayed: n(), matchesWon: n(), matchesLost: n(), rankingPoints: n(), recentForm: [String],
  batting: { innings: n(), notOuts: n(), totalRuns: n(), ballsFaced: n(), highestScore: n(), average: n(), strikeRate: n(), fours: n(), sixes: n(), thirties: n(), fifties: n(), hundreds: n(), ducks: n() },
  bowling: { innings: n(), oversBowled: n(), ballsBowled: n(), runsConceded: n(), wickets: n(), bestBowlingWickets: n(), bestBowlingRuns: n(), average: n(), economyRate: n(), strikeRate: n(), dotBalls: n(), maidens: n(), wides: n(), noBalls: n(), threeWicketHauls: n(), fiveWicketHauls: n() },
  fielding: { catches: n(), runOuts: n(), directRunOuts: n(), droppedCatches: n() },
  wicketkeeping: { matchesAsKeeper: n(), catches: n(), stumpings: n(), totalDismissals: n(), byes: n(), legByes: n() },
  dismissals: { bowled: n(), caught: n(), caughtBehind: n(), lbw: n(), runOut: n(), stumped: n(), hitWicket: n(), totalDismissals: n() },
  awards: { mvpCount: n(), playerOfMatchCount: n(), bestBatsmanAwards: n(), bestBowlerAwards: n() },
  records: { highestScore: { runs: Number, balls: Number, matchId: Schema.Types.ObjectId, date: Date }, bestBowling: { wickets: Number, runs: Number, matchId: Schema.Types.ObjectId, date: Date }, longestWinStreak: n(), currentWinStreak: n() },
}, { timestamps: true });
s.index({ user: 1, sportSlug: 1 }, { unique: true }); s.index({ sportSlug: 1, rankingPoints: -1 });
export const CricketPlayerStats = model<ICricketPlayerStats>("CricketPlayerStats", s);
