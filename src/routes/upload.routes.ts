import { Router, Request, Response } from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';
import { successResponse } from '../utils/apiResponse';

const router = Router();

router.post(
  '/',
  verifyToken,
  verifyAdmin,
  upload.single('image'),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image');
    }

    // Cloudinary URL is available in req.file.path when using multer-storage-cloudinary
    successResponse(
      res,
      {
        url: (req.file as any).path,
        public_id: (req.file as any).filename,
      },
      'Image uploaded successfully'
    );
  }
);

export default router;
