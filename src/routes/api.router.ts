import { Router } from 'express';
import { userRouter } from './user.routes';
import { productRouter } from './product.routes';
import { cartRouter } from './cart.routes';
import { orderRouter } from './order.routes';
import { wishlistRouter } from './wishlist.routes';
import { adminRouter } from './admin.routes';
import uploadRouter from './upload.routes';

export const apiRouter = Router();

apiRouter.use('/users', userRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/carts', cartRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/wishlist', wishlistRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/upload', uploadRouter);
