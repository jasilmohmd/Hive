import { Request } from "express";
import "multer";

export default interface IImageRequest extends Request {
  file?: Express.Multer.File;
}
