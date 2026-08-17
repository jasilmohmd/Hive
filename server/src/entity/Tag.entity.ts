import { Types } from 'mongoose';

export interface ITag {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  categories: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}
