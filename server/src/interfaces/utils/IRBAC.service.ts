import { Types } from "mongoose";

export default interface IRBACService {
  hasPermission(userId: Types.ObjectId, communityId: Types.ObjectId, requiredPermission: string): Promise<boolean>;
}