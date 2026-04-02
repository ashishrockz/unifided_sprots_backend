import{Router}from"express";
import crypto from"crypto";
import{Match}from"../matches/match.model";
import{authenticate}from"../../middleware/auth";
import{validate}from"../../middleware/validate";
import{asyncHandler}from"../../utils/asyncHandler";
import{ok}from"../../utils/response";
import{AppError}from"../../utils/AppError";
import{ERRORS,MSG}from"../../constants";
import{performTossSchema,tossDecisionSchema}from"../matches/matches.validation";
import{emitToMatch}from"../../socket";

export const tossRoutes=Router();
tossRoutes.use(authenticate);

tossRoutes.post("/:matchId/toss",validate(performTossSchema),asyncHandler(async(req:any,res)=>{
  const m=await Match.findById(req.params.matchId);if(!m)throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
  if(m.status!=="team_setup")throw new AppError(ERRORS.BUSINESS.MATCH_NOT_READY);
  if(m.toss?.result)throw new AppError(ERRORS.BUSINESS.TOSS_ALREADY_DONE);
  const{calledBy,call}=req.body;
  const result=crypto.randomInt(0,2)===0?"heads":"tails";
  const callerTeam=m.teams.findIndex((t:any)=>t.players.some((p:any)=>p.user?.toString()===calledBy));
  const wonBy=call===result?callerTeam:(callerTeam===0?1:0);
  m.toss={calledBy,call,result,wonBy}as any;m.status="toss";await m.save();
  emitToMatch(m._id.toString(),"toss:completed",{matchId:m._id,toss:m.toss});
  ok(res,m.toss,MSG.TOSS_DONE);
}));
tossRoutes.get("/:matchId/toss",asyncHandler(async(req,res)=>{const m=await Match.findById(req.params.matchId).lean();if(!m)throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);ok(res,m.toss??null,MSG.FETCHED("Toss"));}));
tossRoutes.post("/:matchId/toss/decision",validate(tossDecisionSchema),asyncHandler(async(req:any,res)=>{const m=await Match.findById(req.params.matchId);if(!m?.toss)throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);m.toss.decision=req.body.decision;await m.save();emitToMatch(m._id.toString(),"toss:decision",{matchId:m._id,toss:m.toss});ok(res,m.toss,MSG.TOSS_DECISION);}));
