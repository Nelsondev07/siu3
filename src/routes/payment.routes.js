import { Router } from 'express';
import { createOrder, captureOrder, cancelOrder } from '../controllers/payment.controller.js';

const router = Router()

router.post('/create-order', createOrder );
router.get('/capture-order', captureOrder);
router.get('/cancel-order', cancelOrder);
export default router;