import { Router } from 'express';
import { SubmissionsController } from './submissions.controller';
import { authenticate } from '../../middleware/auth';
import { codeLimiter } from '../../middleware/rateLimiter';

const router = Router();
const controller = new SubmissionsController();

router.use(authenticate);

router.post('/', codeLimiter, controller.submit);
router.get('/:id', controller.getSubmission);
router.post('/run', codeLimiter, controller.runCode);
router.get('/history', controller.getHistory);

export default router;
