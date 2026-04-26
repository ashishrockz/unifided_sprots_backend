import{Router}from"express";
import{CricketPlayerStats}from"./cricketStats.model";
import{authenticate}from"../../middleware/auth";
import{asyncHandler}from"../../utils/asyncHandler";
import{ok,paginated,buildPage,parseQuery}from"../../utils/response";
import{MSG}from"../../constants";

const SORT:Record<string,any>={overall:{rankingPoints:-1},most_runs:{"batting.totalRuns":-1},highest_average:{"batting.average":-1},best_strike_rate:{"batting.strikeRate":-1},most_fifties:{"batting.fifties":-1},most_hundreds:{"batting.hundreds":-1},most_wickets:{"bowling.wickets":-1},best_economy:{"bowling.economyRate":1},most_catches:{"fielding.catches":-1},most_mvps:{"awards.mvpCount":-1},most_pom:{"awards.playerOfMatchCount":-1},most_wins:{matchesWon:-1}};

export const leaderboardRoutes=Router();
leaderboardRoutes.use(authenticate);
leaderboardRoutes.get("/:slug/leaderboard",asyncHandler(async(req,res)=>{const{page,limit,skip}=parseQuery(req.query);const cat=(req.query.category as string)||"overall";const sort=SORT[cat]??SORT.overall;const[d,t]=await Promise.all([CricketPlayerStats.find({sportSlug:req.params.slug}).populate("user","username displayName avatar country totalMatchesAllSports totalWinsAllSports").sort(sort).skip(skip).limit(limit).lean(),CricketPlayerStats.countDocuments({sportSlug:req.params.slug})]);paginated(res,d,buildPage(page,limit,t),MSG.LIST("Leaderboard"));}));
leaderboardRoutes.get("/:slug/players/:userId/stats",asyncHandler(async(req,res)=>{ok(res,await CricketPlayerStats.findOne({user:req.params.userId,sportSlug:req.params.slug}).populate("user","username displayName avatar country totalMatchesAllSports totalWinsAllSports").lean(),MSG.FETCHED("Stats"));}));
