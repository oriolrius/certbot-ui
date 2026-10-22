import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  host: string;
  port: number;
  nodeEnv: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  auth: {
    usersFile: string;
    adminPassword: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  certbot: {
    path: string;
    configDir: string;
    workDir: string;
    logsDir: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const config: Config = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  auth: {
    usersFile: process.env.USERS_FILE || './data/users.json',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
  },
  certbot: {
    path: process.env.CERTBOT_PATH || '/usr/bin/certbot',
    configDir: process.env.CERTBOT_CONFIG_DIR || '/etc/letsencrypt',
    workDir: process.env.CERTBOT_WORK_DIR || '/var/lib/letsencrypt',
    logsDir: process.env.CERTBOT_LOGS_DIR || '/var/log/letsencrypt',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
