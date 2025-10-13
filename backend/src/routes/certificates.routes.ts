import { Router } from 'express';
import certificatesController from '../controllers/certificates.controller';
import { authMiddleware } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All certificate routes require authentication
router.use(authMiddleware);

router.get('/', certificatesController.list);
router.get('/logs', certificatesController.getLogs);
router.get('/dns-challenge', certificatesController.getDnsChallenge);
router.get('/jobs', certificatesController.listJobs);
router.get('/jobs/:jobId', certificatesController.getJob);
router.get('/root/:root', certificatesController.downloadRootCertificate); // Download root CA certificates
router.get('/:name/download', certificatesController.downloadCertificate); // Download certificate in various formats
router.get('/:name', validate(schemas.certName), certificatesController.getOne);
router.post('/', validate(schemas.certificateRequest), certificatesController.obtain);
router.post('/renew', validate(schemas.renewalOptions), certificatesController.renew);
router.post('/revoke', validate(schemas.revocationOptions), certificatesController.revoke);
router.delete('/:name', validate(schemas.certName), certificatesController.delete);

export default router;
