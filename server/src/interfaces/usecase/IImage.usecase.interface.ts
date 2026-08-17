import { CloudinaryResourceType } from "../../framework/utils/CloudinaryStorageService";

export default interface IImageUsecase {
  upload(
    fileBuffer: Buffer,
    fileName: string,
    isPublic: boolean,
    resourceType?: CloudinaryResourceType
  ): Promise<string>;
}