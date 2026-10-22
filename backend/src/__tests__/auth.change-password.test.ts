import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Regression tests for issue #2: "Can't change admin Password"
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'certbot-ui-users-'));
const usersFile = path.join(tmpDir, 'users.json');
process.env.USERS_FILE = usersFile;

let app: Application;

const login = (username: string, password: string): request.Test =>
  request(app).post('/api/auth/login').send({ username, password });

describe('POST /api/auth/change-password', () => {
  beforeAll(async () => {
    const { default: authRoutes } = await import('../routes/auth.routes');
    const { errorHandler } = await import('../middleware/errorHandler');
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('rejects requests without a valid token', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ username: 'admin', oldPassword: 'admin123', newPassword: 'hijacked123' });

    expect(res.status).toBe(401);
    expect((await login('admin', 'admin123')).status).toBe(200);
  });

  it('changes the password of the authenticated user', async () => {
    const token = (await login('admin', 'admin123')).body.data.token;

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'admin123', newPassword: 'n3w-secret-pass' });

    expect(res.status).toBe(200);
    expect((await login('admin', 'admin123')).status).toBe(401);
    expect((await login('admin', 'n3w-secret-pass')).status).toBe(200);
  });

  it('persists the new password so it survives a restart', async () => {
    const { UserStore } = await import('../services/user.service');
    const reloaded = new UserStore(usersFile);

    expect(await reloaded.verifyPassword('admin', 'n3w-secret-pass')).toBe(true);
    expect(await reloaded.verifyPassword('admin', 'admin123')).toBe(false);
  });

  it('rejects a wrong current password', async () => {
    const token = (await login('admin', 'n3w-secret-pass')).body.data.token;

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'wrong-password', newPassword: 'another-pass-1' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PASSWORD');
  });
});
