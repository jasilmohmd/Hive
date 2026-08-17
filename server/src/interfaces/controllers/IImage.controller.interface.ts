import { Response } from "express";
import IImageRequest from "../common/IImageRequest.interface";

export default interface IImageController {
  uploadImage(req: IImageRequest, res: Response): Promise<void>
}