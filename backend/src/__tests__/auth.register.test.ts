import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Account creation must not be open to anonymous visitors: every user can
// manage certificates, so only an authenticated user may create another one.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'certbot-ui-users-'));
process.env.USERS_FILE = path.join(tmpDir, 'users.json');

let app: Application;

const login = (username: string, password: string): request.Test =>
  request(app).post('/api/auth/login').send({ username, password });

describe('POST /api/auth/register', () => {
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

  it('rejects anonymous registrations', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'intruder', password: 'intruder-pass' });

    expect(res.status).toBe(401);
    expect((await login('intruder', 'intruder-pass')).status).toBe(401);
  });

  it('lets an authenticated user create another user', async () => {
    const token = (await login('admin', 'admin123')).body.data.token;

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'operator', password: 'operator-pass' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.username).toBe('operator');
    expect(res.body.data.token).toBeUndefined();
    expect((await login('operator', 'operator-pass')).status).toBe(200);
  });
});
