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

});

const Users = mongoose.model<IUser>('User', userSchema);

export default Users;
