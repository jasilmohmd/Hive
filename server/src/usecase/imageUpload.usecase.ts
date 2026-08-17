import CloudinaryStorageService, {
  CloudinaryResourceType,
} from "../framework/utils/CloudinaryStorageService";
import IImageUsecase from "../interfaces/usecase/IImage.usecase.interface";

export default class ImageUsecase implements IImageUsecase {
  async upload(
    fileBuffer: Buffer,
    fileName: string,
    isPublic: boolean,
    resourceType: CloudinaryResourceType = "image"
  ): Promise<string> {
    return await CloudinaryStorageService.uploadFile(
      fileBuffer,
      fileName,
      isPublic,
      resourceType
    );
  }
}