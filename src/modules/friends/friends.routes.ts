import{Router}from"express";
import{FriendRequest}from"./friendRequest.model";
import{User}from"../users/user.model";
import{authenticate}from"../../middleware/auth";
import{validate}from"../../middleware/validate";
import{asyncHandler}from"../../utils/asyncHandler";
import{ok,created,paginated,noContent,buildPage,parseQuery}from"../../utils/response";
import{AppError}from"../../utils/AppError";
import{ERRORS,MSG}from"../../constants";
import{sendRequestSchema}from"./friends.validation";
import{NotificationService}from"../notifications/notification.service";

export const friendsRoutes=Router();
friendsRoutes.use(authenticate);

friendsRoutes.post("/request",validate(sendRequestSchema),asyncHandler(async(req:any,res)=>{
  const{receiverId}=req.body,sid=req.user!.userId;
  if(sid===receiverId)throw new AppError(ERRORS.CONFLICT.SELF_REQUEST);
  const ex=await FriendRequest.findOne({$or:[{sender:sid,receiver:receiverId},{sender:receiverId,receiver:sid}]});
  if(ex?.status==="accepted")throw new AppError(ERRORS.CONFLICT.ALREADY_FRIENDS);
  if(ex?.status==="pending")throw new AppError(ERRORS.CONFLICT.REQUEST_PENDING);
  const r=ex?(ex.status="pending",ex.sender=sid as any,ex.receiver=receiverId as any,await ex.save()):await FriendRequest.create({sender:sid,receiver:receiverId});
  // Notify the receiver
  const sender=await User.findById(sid).select("displayName username").lean();
  const senderName=sender?.displayName||sender?.username||"Someone";
  NotificationService.create({
    user:receiverId,
    type:"friend_request_received",
    title:"New friend request",
    body:`${senderName} sent you a friend request`,
    data:{requestId:r._id.toString(),fromUserId:sid},
  }).catch(()=>{/* fire-and-forget */});
  created(res,r,MSG.FRIEND_SENT);
}));
friendsRoutes.put("/request/:id/accept",asyncHandler(async(req:any,res)=>{
  const r=await FriendRequest.findOne({_id:req.params.id,receiver:req.user!.userId,status:"pending"});
  if(!r)throw new AppError(ERRORS.RESOURCE.FRIEND_REQUEST_NOT_FOUND);
  r.status="accepted";r.respondedAt=new Date();await r.save();
  await User.findByIdAndUpdate(r.sender,{$addToSet:{friends:r.receiver}});
  await User.findByIdAndUpdate(r.receiver,{$addToSet:{friends:r.sender}});
  // Notify the original sender that their request was accepted
  const accepter=await User.findById(req.user!.userId).select("displayName username").lean();
  const accepterName=accepter?.displayName||accepter?.username||"Someone";
  NotificationService.create({
    user:r.sender.toString(),
    type:"friend_request_accepted",
    title:"Friend request accepted",
    body:`${accepterName} accepted your friend request`,
    data:{requestId:r._id.toString(),fromUserId:req.user!.userId},
  }).catch(()=>{/* fire-and-forget */});
  ok(res,r,MSG.FRIEND_ACCEPTED);
}));
friendsRoutes.put("/request/:id/reject",asyncHandler(async(req:any,res)=>{
  const r=await FriendRequest.findOne({_id:req.params.id,receiver:req.user!.userId,status:"pending"});
  if(!r)throw new AppError(ERRORS.RESOURCE.FRIEND_REQUEST_NOT_FOUND);
  r.status="rejected";r.respondedAt=new Date();await r.save();ok(res,r,MSG.FRIEND_REJECTED);
}));
friendsRoutes.delete("/request/:id",asyncHandler(async(req:any,res)=>{await FriendRequest.findOneAndDelete({_id:req.params.id,sender:req.user!.userId,status:"pending"});noContent(res);}));
friendsRoutes.get("/requests/pending",asyncHandler(async(req:any,res)=>{const{page,limit,skip}=parseQuery(req.query);const[data,total]=await Promise.all([FriendRequest.find({receiver:req.user!.userId,status:"pending"}).populate("sender","username displayName avatar").sort({createdAt:-1}).skip(skip).limit(limit),FriendRequest.countDocuments({receiver:req.user!.userId,status:"pending"})]);paginated(res,data,buildPage(page,limit,total),MSG.LIST("Requests"));}));
friendsRoutes.get("/requests/sent",asyncHandler(async(req:any,res)=>{const{page,limit,skip}=parseQuery(req.query);const[data,total]=await Promise.all([FriendRequest.find({sender:req.user!.userId,status:"pending"}).populate("receiver","username displayName avatar").sort({createdAt:-1}).skip(skip).limit(limit),FriendRequest.countDocuments({sender:req.user!.userId,status:"pending"})]);paginated(res,data,buildPage(page,limit,total),MSG.LIST("Sent"));}));
friendsRoutes.get("/",asyncHandler(async(req:any,res)=>{const{page,limit,skip}=parseQuery(req.query);const u=await User.findById(req.user!.userId);if(!u)throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);const q:any={_id:{$in:u.friends}};if(req.query.search)q.username={$regex:req.query.search,$options:"i"};const[data,total]=await Promise.all([User.find(q).select("username displayName avatar country lastLoginAt totalMatchesAllSports totalWinsAllSports").skip(skip).limit(limit),User.countDocuments(q)]);paginated(res,data,buildPage(page,limit,total),MSG.LIST("Friends"));}));
friendsRoutes.delete("/:userId",asyncHandler(async(req:any,res)=>{const uid=req.user!.userId,fid=req.params.userId;await User.findByIdAndUpdate(uid,{$pull:{friends:fid}});await User.findByIdAndUpdate(fid,{$pull:{friends:uid}});await FriendRequest.findOneAndDelete({$or:[{sender:uid,receiver:fid,status:"accepted"},{sender:fid,receiver:uid,status:"accepted"}]});noContent(res);}));
