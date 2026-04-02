import{Router}from"express";
import{Advertisement}from"./advertisement.model";
import{authenticate,authorize}from"../../middleware/auth";
import{permit}from"../../middleware/permission";
import{validate}from"../../middleware/validate";
import{asyncHandler}from"../../utils/asyncHandler";
import{ok,created,paginated,noContent,buildPage,parseQuery}from"../../utils/response";
import{AppError}from"../../utils/AppError";
import{ERRORS,MSG}from"../../constants";
import{createAdSchema,updateAdSchema}from"./ads.validation";

export const adminAdsRoutes=Router();
adminAdsRoutes.use(authenticate,authorize("super_admin","content_manager"));
adminAdsRoutes.post("/",permit("ads:create"),validate(createAdSchema),asyncHandler(async(req,res)=>created(res,await Advertisement.create(req.body),MSG.CREATED("Ad"))));
adminAdsRoutes.get("/",permit("ads:read"),asyncHandler(async(req,res)=>{const{page,limit,skip}=parseQuery(req.query);const[d,t]=await Promise.all([Advertisement.find().sort({priority:-1}).skip(skip).limit(limit).lean(),Advertisement.countDocuments()]);paginated(res,d,buildPage(page,limit,t),MSG.LIST("Ads"));}));
adminAdsRoutes.get("/:id",permit("ads:read"),asyncHandler(async(req,res)=>{const a=await Advertisement.findById(req.params.id);if(!a)throw new AppError(ERRORS.RESOURCE.AD_NOT_FOUND);ok(res,a,MSG.FETCHED("Ad"));}));
adminAdsRoutes.put("/:id",permit("ads:update"),validate(updateAdSchema),asyncHandler(async(req,res)=>{const a=await Advertisement.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!a)throw new AppError(ERRORS.RESOURCE.AD_NOT_FOUND);ok(res,a,MSG.UPDATED("Ad"));}));
adminAdsRoutes.delete("/:id",permit("ads:delete"),asyncHandler(async(req,res)=>{await Advertisement.findByIdAndDelete(req.params.id);noContent(res);}));
adminAdsRoutes.patch("/:id/toggle",permit("ads:toggle"),asyncHandler(async(req,res)=>{const a=await Advertisement.findById(req.params.id);if(!a)throw new AppError(ERRORS.RESOURCE.AD_NOT_FOUND);a.isActive=!a.isActive;await a.save();ok(res,a,MSG.TOGGLED("Ad",a.isActive));}));

export const userAdsRoutes=Router();
userAdsRoutes.use(authenticate);
userAdsRoutes.post("/watch/:adId/complete",asyncHandler(async(req,res)=>{await Advertisement.findByIdAndUpdate(req.params.adId,{$inc:{impressionCount:1}});ok(res,{rewardToken:"rwrd_"+Date.now()},MSG.AD_WATCHED);}));
userAdsRoutes.post("/:adId/click",asyncHandler(async(req,res)=>{await Advertisement.findByIdAndUpdate(req.params.adId,{$inc:{clickCount:1}});ok(res,null,"Click recorded");}));
