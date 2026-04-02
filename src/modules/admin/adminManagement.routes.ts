/**
 * @file    modules/admin/adminManagement.routes.ts
 * @desc    Admin CRUD endpoints — create, list, update role,
 *          activate/deactivate admin accounts. Super-admin only.
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../users/user.model";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, paginated, buildPage, parseQuery } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import { createAdminSchema, updateAdminSchema } from "./admin.validation";
import type { AuthRequest } from "../../types";

export const adminManagementRoutes = Router();
adminManagementRoutes.use(authenticate, authorize("super_admin"));

/** POST /admin/admins — Create a new admin account */
adminManagementRoutes.post(
  "/",
  validate(createAdminSchema),
  asyncHandler(async (req, res) => {
    const { email, password, username, displayName, adminRole } = req.body;

    if (await User.findOne({ email })) throw new AppError(ERRORS.ADMIN.EMAIL_TAKEN);
    if (await User.findOne({ username })) throw new AppError(ERRORS.ADMIN.USERNAME_TAKEN);

    const hashed = await bcrypt.hash(password, 12);
    const admin = await User.create({
      email,
      password: hashed,
      username,
      displayName: displayName || username,
      role: "admin",
      adminRole,
    });

    created(res, admin, MSG.ADMIN_CREATED);
  }),
);

/** GET /admin/admins — List all admin accounts (paginated, searchable) */
adminManagementRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parseQuery(req.query);
    const q: any = { role: "admin" };
    if (req.query.search) {
      q.$or = [
        { username: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }
    const [data, total] = await Promise.all([
      User.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(q),
    ]);
    paginated(res, data, buildPage(page, limit, total), MSG.LIST("Admins"));
  }),
);

/** GET /admin/admins/:id — Get single admin */
adminManagementRoutes.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const admin = await User.findOne({ _id: req.params.id, role: "admin" });
    if (!admin) throw new AppError(ERRORS.ADMIN.ADMIN_NOT_FOUND);
    ok(res, admin, MSG.FETCHED("Admin"));
  }),
);

/** PUT /admin/admins/:id — Update admin role */
adminManagementRoutes.put(
  "/:id",
  validate(updateAdminSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    if (req.params.id === req.user!.userId) throw new AppError(ERRORS.ADMIN.CANNOT_MODIFY_SELF);

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      { adminRole: req.body.adminRole },
      { new: true },
    );
    if (!admin) throw new AppError(ERRORS.ADMIN.ADMIN_NOT_FOUND);
    ok(res, admin, MSG.ADMIN_UPDATED);
  }),
);

/** PUT /admin/admins/:id/deactivate — Deactivate admin */
adminManagementRoutes.put(
  "/:id/deactivate",
  asyncHandler(async (req: AuthRequest, res) => {
    if (req.params.id === req.user!.userId) throw new AppError(ERRORS.ADMIN.CANNOT_MODIFY_SELF);

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      { isActive: false },
      { new: true },
    );
    if (!admin) throw new AppError(ERRORS.ADMIN.ADMIN_NOT_FOUND);
    ok(res, admin, MSG.ADMIN_ACTIVATED(false));
  }),
);

/** PUT /admin/admins/:id/activate — Reactivate admin */
adminManagementRoutes.put(
  "/:id/activate",
  asyncHandler(async (req, res) => {
    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      { isActive: true },
      { new: true },
    );
    if (!admin) throw new AppError(ERRORS.ADMIN.ADMIN_NOT_FOUND);
    ok(res, admin, MSG.ADMIN_ACTIVATED(true));
  }),
);

/** DELETE /admin/admins/:id — Remove admin (set role back to user) */
adminManagementRoutes.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    if (req.params.id === req.user!.userId) throw new AppError(ERRORS.ADMIN.CANNOT_MODIFY_SELF);
    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      { role: "user", adminRole: null },
      { new: true },
    );
    if (!admin) throw new AppError(ERRORS.ADMIN.ADMIN_NOT_FOUND);
    ok(res, admin, MSG.DELETED("Admin"));
  }),
);
