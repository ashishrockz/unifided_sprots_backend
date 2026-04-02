/**
 * ─────────────────────────────────────────────────────────────────
 * @file    utils/BaseService.ts
 * @desc    Abstract base service with reusable CRUD operations.
 *          Every module service extends this to avoid duplicating
 *          find, findById, create, update, delete logic.
 *
 * @example
 *   class SportsService extends BaseService<ISportType> {
 *     constructor() { super(SportType, "Sport type"); }
 *   }
 *
 *   // Inherited methods:
 *   SportsService.findAll({ isActive: true }, { name: 1 });
 *   SportsService.findById("64f...");
 *   SportsService.createOne({ name: "Cricket", slug: "cricket" });
 *   SportsService.updateById("64f...", { isActive: false });
 *   SportsService.deleteById("64f...");
 * ─────────────────────────────────────────────────────────────────
 */

import { Model, Document, FilterQuery, QueryOptions } from "mongoose";
import { AppError } from "./AppError";
import type { ErrorDef } from "../constants/errors";

export class BaseService<T extends Document> {
  /**
   * @param model       Mongoose model to operate on
   * @param label       Human-readable name for error messages (e.g. "Sport type")
   * @param notFoundDef Error definition to throw when resource is not found
   */
  constructor(
    protected readonly model: Model<T>,
    protected readonly label: string,
    protected readonly notFoundDef: ErrorDef
  ) {}

  /**
   * Find all documents matching a filter.
   * @param filter    Mongoose filter query
   * @param sort      Sort object (e.g. { createdAt: -1 })
   * @param populate  Optional populate string (e.g. "creator")
   * @returns         Array of lean documents
   */
  async findAll(
    filter: FilterQuery<T> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    populate?: string
  ): Promise<T[]> {
    let query = this.model.find(filter).sort(sort).lean();
    if (populate) query = query.populate(populate) as any;
    return query.exec() as Promise<T[]>;
  }

  /**
   * Find all with pagination.
   * @param filter  Mongoose filter
   * @param skip    Number of documents to skip
   * @param limit   Max documents to return
   * @param sort    Sort object
   * @param populate Optional populate string
   * @returns       { data, total } for paginated response
   */
  async findPaginated(
    filter: FilterQuery<T> = {},
    skip: number,
    limit: number,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    populate?: string
  ): Promise<{ data: T[]; total: number }> {
    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit).lean();
    if (populate) query = query.populate(populate) as any;

    const [data, total] = await Promise.all([
      query.exec() as Promise<T[]>,
      this.model.countDocuments(filter),
    ]);

    return { data, total };
  }

  /**
   * Find a single document by ID.
   * @param id        Document _id
   * @param populate  Optional populate string
   * @throws          AppError if not found
   */
  async findById(id: string, populate?: string): Promise<T> {
    let query = this.model.findById(id).lean();
    if (populate) query = query.populate(populate) as any;

    const doc = await query.exec();
    if (!doc) throw new AppError(this.notFoundDef);
    return doc as T;
  }

  /**
   * Find a single document by arbitrary filter.
   * @param filter    Mongoose filter
   * @param populate  Optional populate string
   * @throws          AppError if not found
   */
  async findOne(filter: FilterQuery<T>, populate?: string): Promise<T> {
    let query = this.model.findOne(filter).lean();
    if (populate) query = query.populate(populate) as any;

    const doc = await query.exec();
    if (!doc) throw new AppError(this.notFoundDef);
    return doc as T;
  }

  /**
   * Create a new document.
   * @param data  Fields to create with
   */
  async createOne(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toObject() as T;
  }

  /**
   * Update a document by ID.
   * @param id    Document _id
   * @param data  Fields to update
   * @throws      AppError if not found
   */
  async updateById(id: string, data: Partial<T>): Promise<T> {
    const doc = await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new AppError(this.notFoundDef);
    return doc.toObject() as T;
  }

  /**
   * Delete a document by ID (hard delete).
   * @param id  Document _id
   */
  async deleteById(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  /**
   * Count documents matching a filter.
   * @param filter  Mongoose filter
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }
}
