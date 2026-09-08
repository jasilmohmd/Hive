import mongoose, { Schema, Types } from "mongoose";
import IUser from "../../entity/User.entity";

const userSchema: Schema = new Schema<IUser>({
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  friends: [{
    type: Types.ObjectId,
    ref: "Users"
  }],
  friendRequests: [{
    sender: {
      type: Types.ObjectId,
      ref: "Users",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  }],
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline"
  },
  blocked: [{
    type: Types.ObjectId,
    ref: "Users"
  }],
  imageUrl: {
    type: String,
    required: false,
  },

}, {
  // Never serialise the password hash. This covers every response path,
  // including User docs populated into other resources (e.g. a community's
  // members / joinRequests). Direct property access (auth's
  // bcrypt.compare(plain, user.password)) is unaffected, and repositories
  // that genuinely need the hash read it before serialisation.
  toJSON: {
    transform(_doc, ret: Record<string, unknown>) {
      delete ret['password'];
      return ret;
    },
  },
});

const Users = mongoose.model<IUser>('User', userSchema);

export default Users;
