import{Router}from"express";
import{SportType}from"./sportType.model";
import{getRedis}from"../../config/redis";
import{authenticate,authorize}from"../../middleware/auth";
import{permit}from"../../middleware/permission";
import{validate}from"../../middleware/validate";
import{asyncHandler}from"../../utils/asyncHandler";
import{ok,created}from"../../utils/response";
import{AppError}from"../../utils/AppError";
import{ERRORS,MSG}from"../../constants";
import{createSportSchema,updateSportSchema}from"./sports.validation";

const CK="sports:active",TTL=300;
async function clearCache(){await getRedis().del(CK);}

export const sportsRoutes=Router();
sportsRoutes.get("/",asyncHandler(async(_,res)=>{const c=await getRedis().get(CK);if(c)return ok(res,JSON.parse(c),MSG.LIST("Sports"));const d=await SportType.find({isActive:true}).sort({name:1}).lean();await getRedis().set(CK,JSON.stringify(d),"EX",TTL);ok(res,d,MSG.LIST("Sports"));}));
sportsRoutes.get("/:slug",asyncHandler(async(req,res)=>{const s=await SportType.findOne({slug:req.params.slug}).lean();if(!s)throw new AppError(ERRORS.RESOURCE.SPORT_NOT_FOUND);ok(res,s,MSG.FETCHED("Sport"));}));

export const adminSportsRoutes=Router();
adminSportsRoutes.use(authenticate,authorize("super_admin","sport_admin"));
adminSportsRoutes.post("/",permit("sports:create"),validate(createSportSchema),asyncHandler(async(req,res)=>{if(await SportType.findOne({slug:req.body.slug}))throw new AppError(ERRORS.CONFLICT.DUPLICATE_SLUG);const s=await SportType.create(req.body);await clearCache();created(res,s,MSG.CREATED("Sport"));}));
adminSportsRoutes.get("/",permit("sports:read"),asyncHandler(async(_,res)=>ok(res,await SportType.find().sort({name:1}).lean(),MSG.LIST("Sports"))));
adminSportsRoutes.get("/:id",permit("sports:read"),asyncHandler(async(req,res)=>{const s=await SportType.findById(req.params.id);if(!s)throw new AppError(ERRORS.RESOURCE.SPORT_NOT_FOUND);ok(res,s,MSG.FETCHED("Sport"));}));
adminSportsRoutes.put("/:id",permit("sports:update"),validate(updateSportSchema),asyncHandler(async(req,res)=>{const s=await SportType.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!s)throw new AppError(ERRORS.RESOURCE.SPORT_NOT_FOUND);await clearCache();ok(res,s,MSG.UPDATED("Sport"));}));
adminSportsRoutes.patch("/:id/toggle",permit("sports:toggle"),asyncHandler(async(req,res)=>{const s=await SportType.findById(req.params.id);if(!s)throw new AppError(ERRORS.RESOURCE.SPORT_NOT_FOUND);s.isActive=!s.isActive;await s.save();await clearCache();ok(res,s,MSG.TOGGLED("Sport",s.isActive));}));
adminSportsRoutes.delete("/:id",permit("sports:delete"),asyncHandler(async(req,res)=>{const s=await SportType.findByIdAndUpdate(req.params.id,{isActive:false},{new:true});if(!s)throw new AppError(ERRORS.RESOURCE.SPORT_NOT_FOUND);await clearCache();ok(res,s,MSG.DELETED("Sport"));}));
