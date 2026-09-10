import { Types } from "mongoose";
import Users from "../framework/models/user.model";
import {
  IUserPublicProfile,
  IUserRepository,
} from "../interfaces/repository/IUser.repository.interface";

export class UserRepository implements IUserRepository {
  async findPublicProfileById(
    userId: string | Types.ObjectId
  ): Promise<IUserPublicProfile | null> {
    const doc = await Users.findById(userId).select("_id userName imageUrl").lean();
    if (!doc) return null;
    const row = doc as { _id: unknown; userName?: string; imageUrl?: string };
    return {
      _id: String(row._id),
      userName: typeof row.userName === "string" ? row.userName : "",
      imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : undefined,
    };
  }
}
