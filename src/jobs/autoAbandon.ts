import{Match}from"../modules/matches/match.model";
import{emitToMatch}from"../socket";
import{SOCKET_EVENTS}from"../constants";
import{logger}from"../utils/logger";
export function startAutoAbandon(){
  logger.info("🔄 Auto-abandon worker started (5 min)");
  setInterval(async()=>{
    try{const now=new Date();for(const m of await Match.find({status:"live"})){
      if(now.getTime()-new Date(m.lastActivityAt).getTime()>(m.inactivityLimit??30)*60000){
        m.status="abandoned";m.abandonedBy="system";m.abandonReason="Inactivity auto-abandon";m.completedAt=now;await m.save();
        emitToMatch(m._id.toString(),SOCKET_EVENTS.MATCH_ABANDONED,{matchId:m._id});
        logger.info("Auto-abandoned: "+m._id);
      }
    }}catch(e){logger.error("Auto-abandon err:",e);}
  },300000);
}
