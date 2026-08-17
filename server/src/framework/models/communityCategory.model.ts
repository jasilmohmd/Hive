import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from '../../entity/CommunityCategory.entity';


const CategorySchema = new Schema<ICategory & Document>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String }
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.model<ICategory & Document>('Category', CategorySchema);
