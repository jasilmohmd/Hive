import mongoose, { Schema, Document } from 'mongoose';
import { ITag } from '../../entity/Tag.entity';


const TagSchema = new Schema<ITag & Document>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }]
  },
  { timestamps: true }
);

export const TagModel = mongoose.model<ITag & Document>('Tag', TagSchema);
