/**
 * @file    modules/posts/post.model.ts
 * @desc    Post schema — admin (CricCircle) and user-generated content
 *          with media, likes, comments, and share tracking.
 */
import { Schema, model, Document, Types } from "mongoose";

/* ── Interfaces ─────────────────────────────────────── */

export interface IComment {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  authorType: "admin" | "user";
  content: string;
  media: { url: string; key: string; type: "image" | "video" }[];
  likes: Types.ObjectId[];
  likesCount: number;
  comments: Types.DocumentArray<IComment>;
  commentsCount: number;
  sharesCount: number;
  isActive: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema ─────────────────────────────────────────── */

const commentSchema = new Schema<IComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 500, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorType: { type: String, enum: ["admin", "user"], default: "user" },
    content: { type: String, maxlength: 2000, trim: true, default: "" },
    media: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
      },
    ],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    comments: [commentSchema],
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_d, r: Record<string, any>) => {
        delete r.__v;
        return r;
      },
    },
  },
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ authorType: 1, createdAt: -1 });

export const Post = model<IPost>("Post", postSchema);
