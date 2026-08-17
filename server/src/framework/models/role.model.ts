import mongoose, { Schema, Document, Types } from 'mongoose';
import { IRole } from '../../entity/Role.entity'; // Ensure correct import

const RoleSchema = new Schema<IRole & Document>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    name: { type: String, required: true },
    permissions: [{ type: String, required: true }],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const RoleModel = mongoose.model<IRole & Document>('Role', RoleSchema);
