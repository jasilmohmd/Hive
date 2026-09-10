import { Types } from "mongoose";

/** The non-sensitive subset of a user other features are allowed to read. */
export interface IUserPublicProfile {
  _id: string;
  userName: string;
  imageUrl?: string;
}

export interface IUserRepository {
  /** Look up a user's public profile (name + avatar). Returns null if not found. */
  findPublicProfileById(userId: string | Types.ObjectId): Promise<IUserPublicProfile | null>;
}
