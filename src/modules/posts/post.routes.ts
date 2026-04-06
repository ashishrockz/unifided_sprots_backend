/**
 * @file    modules/posts/post.routes.ts
 * @desc    Post endpoints — feed, CRUD, like/comment/share.
 *          Admin posts show under "CricCircle" profile name.
 */
import { Router } from "express";
import { Post } from "./post.model";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, paginated, buildPage, parseQuery } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import { createPostSchema, addCommentSchema } from "./post.validation";
import type { AuthRequest } from "../../types";

/* ═══════════════════════════════════════════════════════
 *  USER-FACING ROUTES
 * ═══════════════════════════════════════════════════════ */
export const postRoutes = Router();

/**
 * GET /posts/feed — Public feed (admin + user posts, newest first)
 * Pinned posts appear first, then sorted by createdAt desc.
 */
postRoutes.get(
  "/feed",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { page, limit, skip } = parseQuery(req.query);
    const q: any = { isActive: true };

    const [data, total] = await Promise.all([
      Post.find(q)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username displayName avatar role")
        .populate("comments.user", "username displayName avatar")
        .lean(),
      Post.countDocuments(q),
    ]);

    // Attach `isLiked` flag for the requesting user
    const userId = req.user?.userId;
    const enriched = data.map((post: any) => ({
      ...post,
      isLiked: post.likes?.some((id: any) => id.toString() === userId) ?? false,
      likes: undefined, // Don't send full likes array to client
    }));

    paginated(res, enriched, buildPage(page, limit, total), MSG.LIST("Posts"));
  }),
);

/**
 * POST /posts — Create a new post (user-generated)
 */
postRoutes.post(
  "/",
  authenticate,
  validate(createPostSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { content, media } = req.body;
    if (!content && (!media || media.length === 0)) {
      throw new AppError(ERRORS.VALIDATION.MISSING_FIELD);
    }
    const post = await Post.create({
      author: req.user?.userId,
      authorType: "user",
      content,
      media,
    });
    const populated = await Post.findById(post._id)
      .populate("author", "username displayName avatar role")
      .lean();
    created(res, populated, MSG.CREATED("Post"));
  }),
);

/**
 * POST /posts/:id/like — Toggle like on a post
 */
postRoutes.post(
  "/:id/like",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isActive) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);

    const userId = req.user!.userId;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId) as any;
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(userId as any);
      post.likesCount = post.likesCount + 1;
    }
    await post.save();

    ok(res, { isLiked: !alreadyLiked, likesCount: post.likesCount }, alreadyLiked ? "Post unliked" : "Post liked");
  }),
);

/**
 * POST /posts/:id/comments — Add a comment
 */
postRoutes.post(
  "/:id/comments",
  authenticate,
  validate(addCommentSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isActive) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);

    post.comments.push({ user: req.user!.userId, text: req.body.text } as any);
    post.commentsCount = post.comments.length;
    await post.save();

    // Return the newly added comment populated
    const updated = await Post.findById(post._id)
      .select("comments commentsCount")
      .populate("comments.user", "username displayName avatar")
      .lean();

    created(res, updated, MSG.CREATED("Comment"));
  }),
);

/**
 * DELETE /posts/:id/comments/:commentId — Delete own comment
 */
postRoutes.delete(
  "/:id/comments/:commentId",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isActive) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);

    const commentId = req.params.commentId as string;
    const comment = post.comments.id(commentId);
    if (!comment) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);
    if (comment.user.toString() !== req.user!.userId) {
      throw new AppError(ERRORS.AUTH.FORBIDDEN);
    }

    post.comments.pull(commentId);
    post.commentsCount = post.comments.length;
    await post.save();

    ok(res, null, "Comment deleted");
  }),
);

/**
 * POST /posts/:id/share — Increment share count
 */
postRoutes.post(
  "/:id/share",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { $inc: { sharesCount: 1 } },
      { new: true },
    );
    if (!post) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);
    ok(res, { sharesCount: post.sharesCount }, "Share recorded");
  }),
);

/**
 * DELETE /posts/:id — Delete own post
 */
postRoutes.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);
    if (post.author.toString() !== req.user!.userId) {
      throw new AppError(ERRORS.AUTH.FORBIDDEN);
    }
    post.isActive = false;
    await post.save();
    ok(res, null, "Post deleted");
  }),
);

/* ═══════════════════════════════════════════════════════
 *  ADMIN ROUTES (posts under "CricCircle" brand)
 * ═══════════════════════════════════════════════════════ */
export const adminPostRoutes = Router();
adminPostRoutes.use(authenticate, authorize("super_admin", "content_manager"));

/**
 * GET /admin/posts — List all posts (admin view)
 */
adminPostRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parseQuery(req.query);
    const q: any = {};
    if (req.query.authorType) q.authorType = req.query.authorType;
    if (req.query.active === "true") q.isActive = true;
    if (req.query.active === "false") q.isActive = false;

    const [data, total] = await Promise.all([
      Post.find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username displayName avatar role")
        .lean(),
      Post.countDocuments(q),
    ]);
    paginated(res, data, buildPage(page, limit, total), MSG.LIST("Posts"));
  }),
);

/**
 * POST /admin/posts — Create admin post (shows under "CricCircle")
 */
adminPostRoutes.post(
  "/",
  validate(createPostSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { content, media } = req.body;
    if (!content && (!media || media.length === 0)) {
      throw new AppError(ERRORS.VALIDATION.MISSING_FIELD);
    }
    const post = await Post.create({
      author: req.user?.userId,
      authorType: "admin",
      content,
      media,
      isPinned: req.body.isPinned || false,
    });
    const populated = await Post.findById(post._id)
      .populate("author", "username displayName avatar role")
      .lean();
    created(res, populated, MSG.CREATED("Post"));
  }),
);

/**
 * PUT /admin/posts/:id — Update post
 */
adminPostRoutes.put(
  "/:id",
  validate(createPostSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const updates: any = {};
    if (req.body.content !== undefined) updates.content = req.body.content;
    if (req.body.media !== undefined) updates.media = req.body.media;
    if (req.body.isPinned !== undefined) updates.isPinned = req.body.isPinned;

    const post = await Post.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("author", "username displayName avatar role")
      .lean();
    if (!post) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);
    ok(res, post, MSG.UPDATED("Post"));
  }),
);

/**
 * DELETE /admin/posts/:id — Soft-delete post
 */
adminPostRoutes.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const post = await Post.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!post) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);
    ok(res, null, "Post deleted");
  }),
);

/**
 * PUT /admin/posts/:id/pin — Toggle pin
 */
adminPostRoutes.put(
  "/:id/pin",
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError(ERRORS.RESOURCE.POST_NOT_FOUND);
    post.isPinned = !post.isPinned;
    await post.save();
    ok(res, { isPinned: post.isPinned }, post.isPinned ? "Post pinned" : "Post unpinned");
  }),
);
