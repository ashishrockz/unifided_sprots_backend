import{Server as HttpServer}from"http";
import{Server}from"socket.io";
import jwt from"jsonwebtoken";
import{env}from"../config/env";
import{logger}from"../utils/logger";
let io:Server;
export function initSocket(http:HttpServer):Server{
  io=new Server(http,{cors:{origin:env.CORS_ORIGINS.split(","),credentials:true}});
  io.use((s,next)=>{try{const t=s.handshake.auth?.token??s.handshake.query?.token;if(!t)return next(new Error("Auth required"));(s as any).user=jwt.verify(t as string,env.JWT_ACCESS_SECRET);next();}catch{next(new Error("Invalid token"));}});
  io.on("connection",s=>{const u=(s as any).user;s.join("user:"+u.userId);s.on("match:join",(id:string)=>s.join("match:"+id));s.on("match:leave",(id:string)=>s.leave("match:"+id));});
  logger.info("✅ Socket.IO ready");return io;
}
export const getIO=()=>io;
export const emitToMatch=(id:string,ev:string,d:any)=>io?.to("match:"+id).emit(ev,d);
export const emitToUser=(id:string,ev:string,d:any)=>io?.to("user:"+id).emit(ev,d);
