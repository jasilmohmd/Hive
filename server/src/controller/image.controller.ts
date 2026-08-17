import { Response } from 'express';
import IImageRequest from '../interfaces/common/IImageRequest.interface';
import IImageUsecase from '../interfaces/usecase/IImage.usecase.interface';


export default class ImageController {

  constructor( private imageUsecase: IImageUsecase) {}

  async uploadImage(req: IImageRequest, res: Response): Promise<void> {
    try {

      const file = req.file

      if (!file) {
        res.status(400).json({ message: 'No file uploaded' });
        return
      }
      const isPublic = req.body.isPublic === 'true';
      const imageUrl = await this.imageUsecase.upload(file.buffer, file.originalname, isPublic);
      res.status(200).json({ imageUrl });
    } catch (error: any) {
      const message = error?.message || 'Image upload failed';
      console.error('Image upload error:', message);
      res.status(500).json({ message });
    }
  }
}