import { Router } from 'express';
import multer from 'multer';
import IImageController from '../../interfaces/controllers/IImage.controller.interface';
import ImageController from '../../controller/image.controller';
import ImageUsecase from '../../usecase/imageUpload.usecase';
import IImageUsecase from '../../interfaces/usecase/IImage.usecase.interface';
import JWTService from '../utils/jwt.service';
import AuthMiddleware from '../middlewares/auth.middleware';
import IJWTService from '../../interfaces/utils/IJwt.service';
import IAuthMiddleware from '../../interfaces/middleware/IAuth.middleware.interface';

const jwtService: IJWTService = new JWTService();
const authMiddleware: IAuthMiddleware = new AuthMiddleware(jwtService);

// Set up multer for memory storage, capped at 5MB and restricted to image MIME types
const MB = 1024 * 1024;
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * MB },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const imageUsecase: IImageUsecase = new ImageUsecase()

// Create an instance of your controller, injecting the use case
const imageController : IImageController = new ImageController(imageUsecase);

// Create a router
const imageRouter = Router();

// Define the route for image upload
imageRouter.route('/upload').post(
  authMiddleware.isAuthenticated.bind(authMiddleware),
  uploadMiddleware.single('file'),
  imageController.uploadImage.bind(imageController)
);

export default imageRouter;
