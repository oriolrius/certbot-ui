import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { CertbotResult, CertificateRequest, RenewalOptions, RevocationOptions } from '../types';

export type JobType = 'obtain' | 'renew' | 'revoke' | 'delete';
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  userId: string;
  request: CertificateRequest | RenewalOptions | RevocationOptions | { certName: string };
  result?: CertbotResult;
  error?: string;
  progress?: number;
  progressMessage?: string;
  dnsChallenge?: {
    domain: string;
    validation: string;
    record_name: string;
    timestamp: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class JobService {
  private jobs: Map<string, Job> = new Map();
  private readonly MAX_COMPLETED_JOBS = 100; // Keep last 100 completed jobs
  private readonly JOB_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Clean up old jobs periodically
    setInterval(() => this.cleanupOldJobs(), 60 * 60 * 1000); // Every hour
  }

  createJob(
    type: JobType,
    userId: string,
    request: CertificateRequest | RenewalOptions | RevocationOptions | { certName: string }
  ): Job {
    const job: Job = {
      id: uuidv4(),
      type,
      status: 'pending',
      userId,
      request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(job.id, job);
    logger.info(`Job ${job.id} created: ${type}`);
    return job;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getUserJobs(userId: string): Job[] {
    return Array.from(this.jobs.values())
      .filter((job) => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateJobStatus(jobId: string, status: JobStatus): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.warn(`Attempted to update non-existent job: ${jobId}`);
      return;
    }

    job.status = status;
    job.updatedAt = new Date();

    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date();
    }

    logger.info(`Job ${jobId} status updated: ${status}`);
  }

  updateJobProgress(jobId: string, progress: number, message: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.warn(`Attempted to update progress for non-existent job: ${jobId}`);
      return;
    }

    job.progress = progress;
    job.progressMessage = message;
    job.updatedAt = new Date();

    logger.info(`Job ${jobId} progress: ${progress}% - ${message}`);
  }

  updateJobDnsChallenge(
    jobId: string,
    challenge: {
      domain: string;
      validation: string;
      record_name: string;
      timestamp: string;
    } | null
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.warn(`Attempted to update DNS challenge for non-existent job: ${jobId}`);
      return;
    }

    job.dnsChallenge = challenge;
    job.updatedAt = new Date();

    if (challenge) {
      logger.info(`Job ${jobId} DNS challenge updated for domain: ${challenge.domain}`);
    } else {
      logger.info(`Job ${jobId} DNS challenge cleared`);
    }
  }

  completeJob(jobId: string, result: CertbotResult): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.warn(`Attempted to complete non-existent job: ${jobId}`);
      return;
    }

    job.result = result;
    job.status = result.success ? 'completed' : 'failed';
    job.completedAt = new Date();
    job.updatedAt = new Date();

    if (!result.success) {
      job.error = result.stderr || 'Unknown error occurred';
    }

    logger.info(`Job ${jobId} completed with status: ${job.status}`);
  }

  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.warn(`Attempted to fail non-existent job: ${jobId}`);
      return;
    }

    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date();
    job.updatedAt = new Date();

    logger.error(`Job ${jobId} failed: ${error}`);
  }

  private cleanupOldJobs(): void {
    const now = Date.now();
    const completedJobs: Job[] = [];

    // Collect completed jobs
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        const age = now - job.updatedAt.getTime();

        // Remove jobs older than retention period
        if (age > this.JOB_RETENTION_MS) {
          this.jobs.delete(jobId);
          logger.info(`Cleaned up old job: ${jobId}`);
        } else {
          completedJobs.push(job);
        }
      }
    }

    // If we have too many completed jobs, remove the oldest ones
    if (completedJobs.length > this.MAX_COMPLETED_JOBS) {
      const sorted = completedJobs.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
      const toRemove = sorted.slice(0, completedJobs.length - this.MAX_COMPLETED_JOBS);

      toRemove.forEach((job) => {
        this.jobs.delete(job.id);
        logger.info(`Cleaned up completed job: ${job.id}`);
      });
    }
  }
}

export default new JobService();
