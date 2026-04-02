import{Router}from"express";
import{Notification}from"./notification.model";
import{authenticate}from"../../middleware/auth";
import{asyncHandler}from"../../utils/asyncHandler";
import{ok,paginated,noContent,buildPage,parseQuery}from"../../utils/response";
import{MSG}from"../../constants";

export const notificationRoutes=Router();
notificationRoutes.use(authenticate);
notificationRoutes.get("/",asyncHandler(async(req:any,res)=>{const{page,limit,skip}=parseQuery(req.query);const[d,t]=await Promise.all([Notification.find({user:req.user!.userId}).sort({createdAt:-1}).skip(skip).limit(limit).lean(),Notification.countDocuments({user:req.user!.userId})]);paginated(res,d,buildPage(page,limit,t),MSG.LIST("Notifications"));}));
notificationRoutes.put("/:id/read",asyncHandler(async(req:any,res)=>{await Notification.findOneAndUpdate({_id:req.params.id,user:req.user!.userId},{isRead:true});ok(res,null,MSG.MARKED_READ);}));
notificationRoutes.put("/read-all",asyncHandler(async(req:any,res)=>{await Notification.updateMany({user:req.user!.userId,isRead:false},{isRead:true});ok(res,null,MSG.ALL_READ);}));
notificationRoutes.delete("/:id",asyncHandler(async(req:any,res)=>{await Notification.findOneAndDelete({_id:req.params.id,user:req.user!.userId});noContent(res);}));
notificationRoutes.get("/unread-count",asyncHandler(async(req:any,res)=>{ok(res,{count:await Notification.countDocuments({user:req.user!.userId,isRead:false})},MSG.FETCHED("Count"));}));
