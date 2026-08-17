import { Router } from 'express';
import multer from 'multer';
import IImageController from '../../interfaces/controllers/IImage.controller.interface';
import ImageController from '../../controller/image.controller';
import ImageUsecase from '../../usecase/imageUpload.usecase';
import IImageUsecase from '../../interfaces/usecase/IImage.usecase.interface';


// Set up multer for memory storage
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage });

const imageUsecase: IImageUsecase = new ImageUsecase()

// Create an instance of your controller, injecting the use case
const imageController : IImageController = new ImageController(imageUsecase);

// Create a router
const imageRouter = Router();

// Define the route for image upload
imageRouter.route('/upload').post( uploadMiddleware.single('file'), imageController.uploadImage.bind(imageController));

export default imageRouter;
