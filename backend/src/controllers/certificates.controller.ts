import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import certbotService from '../services/certbot.service';
import jobService from '../services/job.service';
import certificateDownloadService, {
  CertificateFormat,
  CertificateComponent,
} from '../services/certificate-download.service';
import { AppError } from '../middleware/errorHandler';

export class CertificatesController {
  async list(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificates = await certbotService.listCertificates();

      res.json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const certificate = await certbotService.getCertificateInfo(name);

      if (!certificate) {
        throw new AppError('Certificate not found', 404, 'CERT_NOT_FOUND');
      }

      res.json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtain(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'AUTH_REQUIRED');
      }

      // Create job and return immediately
      const job = jobService.createJob('obtain', req.user.id, req.body);

      // Execute async operation in background
      setImmediate(() => {
        certbotService.obtainCertificateAsync(job.id, req.user!.id, req.body).catch((error) => {
          console.error('Background job error:', error);
        });
      });

      // Return 202 Accepted with job ID
      res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
        },
        message: 'Certificate request accepted. Check job status for progress.',
      });
    } catch (error) {
      next(error);
    }
  }

  async renew(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'AUTH_REQUIRED');
      }

      // Create job and return immediately
      const job = jobService.createJob('renew', req.user.id, req.body);

      // Execute async operation in background
      setImmediate(() => {
        certbotService.renewCertificateAsync(job.id, req.user!.id, req.body).catch((error) => {
          console.error('Background job error:', error);
        });
      });

      // Return 202 Accepted with job ID
      res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
        },
        message: 'Certificate renewal accepted. Check job status for progress.',
      });
    } catch (error) {
      next(error);
    }
  }

  async revoke(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'AUTH_REQUIRED');
      }

      // Create job and return immediately
      const job = jobService.createJob('revoke', req.user.id, req.body);

      // Execute async operation in background
      setImmediate(() => {
        certbotService.revokeCertificateAsync(job.id, req.user!.id, req.body).catch((error) => {
          console.error('Background job error:', error);
        });
      });

      // Return 202 Accepted with job ID
      res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
        },
        message: 'Certificate revocation accepted. Check job status for progress.',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'AUTH_REQUIRED');
      }

      const { name } = req.params;

      // Create job and return immediately
      const job = jobService.createJob('delete', req.user.id, { certName: name });

      // Execute async operation in background
      setImmediate(() => {
        certbotService.deleteCertificateAsync(job.id, req.user!.id, name).catch((error) => {
          console.error('Background job error:', error);
        });
      });

      // Return 202 Accepted with job ID
      res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
        },
        message: 'Certificate deletion accepted. Check job status for progress.',
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await certbotService.getLogs(limit);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDnsChallenge(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const challenge = await certbotService.getDnsChallenge();

      res.json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      next(error);
    }
  }

  async getJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'AUTH_REQUIRED');
      }

      const { jobId } = req.params;
      const job = jobService.getJob(jobId);

      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      // Ensure user can only access their own jobs
      if (job.userId !== req.user.id) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  }

  async listJobs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401, 'AUTH_REQUIRED');
      }

      const jobs = jobService.getUserJobs(req.user.id);

      res.json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadCertificate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      let { format, component, password } = req.query;

      // Trim whitespace from query parameters
      format = typeof format === 'string' ? format.trim() : format;
      component = typeof component === 'string' ? component.trim() : component;
      password = typeof password === 'string' ? password.trim() : password;

      // Validate required parameters
      if (!format || !component) {
        throw new AppError('Format and component are required', 400, 'MISSING_PARAMETERS');
      }

      // Get certificate in requested format
      const certData = await certificateDownloadService.getCertificate({
        certName: name,
        format: format as CertificateFormat,
        component: component as CertificateComponent,
        password: password as string | undefined,
      });

      // Get filename and MIME type
      const filename = certificateDownloadService.getFilename(
        name,
        format as CertificateFormat,
        component as CertificateComponent
      );
      const mimeType = certificateDownloadService.getMimeType(format as CertificateFormat);

      // Set headers for download
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', certData.length);

      res.send(certData);
    } catch (error) {
      next(error);
    }
  }

  async downloadRootCertificate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { root } = req.params; // 'x1' or 'x2'

      const rootCerts = await certificateDownloadService.getRootCertificates();

      let certData: Buffer;
      let filename: string;

      if (root === 'x1') {
        certData = rootCerts.isrgRootX1;
        filename = 'isrg-root-x1.pem';
      } else if (root === 'x2') {
        certData = rootCerts.isrgRootX2;
        filename = 'isrg-root-x2.pem';
      } else {
        throw new AppError('Invalid root certificate. Use x1 or x2', 400, 'INVALID_ROOT');
      }

      res.setHeader('Content-Type', 'application/x-pem-file');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', certData.length);

      res.send(certData);
    } catch (error) {
      next(error);
    }
  }
}

export default new CertificatesController();
