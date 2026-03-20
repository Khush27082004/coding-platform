import { Router } from 'express';
import { AssessmentsController } from './assessments.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new AssessmentsController();

router.use(authenticate);

router.post('/', authorize('admin'), controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/:id/assign', authorize('admin'), controller.assign);
router.post('/:id/start', controller.start);

export default router;
