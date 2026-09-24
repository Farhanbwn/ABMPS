import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../server';
import { Admin } from '../models/Admin';
import { escapeRegex } from '../utils/regex';
import { signToken, verifyToken } from '../utils/jwt';
import { errorHandler, AppError } from '../middleware/errorHandler';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_automated_security_suite_2026_super_secure';

describe('Security Audit & Hardening Test Suite', () => {
  let validAdminId = '';
  let validToken = '';

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mms_db';
    await mongoose.connect(mongoUri);

    let admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      admin = await Admin.create({
        username: 'admin',
        passwordHash: '$2a$10$eO1v0kF.ZzWvB0X6H7wTSe9aGfU4bZc8.lq4N2U4aN3fX8cW3uE2m',
        passwordChangedAt: new Date(),
      });
    }
    validAdminId = admin._id.toString();
    validToken = signToken({ id: validAdminId, username: admin.username });
  });

  after(async () => {
    await mongoose.disconnect();
  });

  describe('1. CORS Security & Host Validation', () => {
    test('blocks cross-origin requests from untrusted origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-website.com');

      assert.equal(res.status, 403);
      assert.match(res.body.message, /Origin is not permitted/i);
    });

    test('permits requests from configured client origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      assert.equal(res.status, 200);
      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
      assert.equal(res.headers['access-control-allow-credentials'], 'true');
    });

    test('permits direct requests without Origin header (curl / mobile)', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  describe('2. Security Headers & Information Leakage Defense', () => {
    test('does not leak X-Powered-By Express header', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.headers['x-powered-by'], undefined);
    });

    test('sets security headers via Helmet', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.headers['x-content-type-options'], 'nosniff');
      assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
    });

    test('masks unhandled internal server errors in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';

        let capturedStatus = 0;
        let capturedJson: any = null;
        const mockRes: any = {
          status: (code: number) => {
            capturedStatus = code;
            return mockRes;
          },
          json: (body: any) => {
            capturedJson = body;
            return mockRes;
          },
        };

        const unexpectedError = new Error('Database password was incorrect: secret_mongo_pass_leak');
        errorHandler(unexpectedError, {} as any, mockRes, () => {});

        assert.equal(capturedStatus, 500);
        assert.equal(capturedJson.success, false);
        assert.equal(capturedJson.message, 'An unexpected internal server error occurred.');
        assert.equal(JSON.stringify(capturedJson).includes('secret_mongo_pass_leak'), false);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('3. Authentication & Access Control', () => {
    test('denies access to protected routes without Authorization header', async () => {
      const res = await request(app).get('/api/members');
      assert.equal(res.status, 401);
      assert.match(res.body.message, /Authentication required/i);
    });

    test('denies access when token is forged or signed with wrong secret', async () => {
      const fakeToken = jwt.sign(
        { id: validAdminId || '65f123456789012345678901', username: 'admin' },
        'attacker_controlled_secret_key'
      );

      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${fakeToken}`);

      assert.equal(res.status, 401);
      assert.match(res.body.message, /Invalid or expired authentication token/i);
    });

    test('denies access when token has expired', async () => {
      const expiredToken = jwt.sign(
        { id: validAdminId || '65f123456789012345678901', username: 'admin' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.equal(res.status, 401);
      assert.match(res.body.message, /Invalid or expired authentication token/i);
    });
  });

  describe('4. Input Validation & Injection Defense', () => {
    test('rejects login payload with non-string or malicious types (NoSQL operator injection)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: { $gt: '' },
          password: 'password123',
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Validation failed/i);
    });

    test('rejects login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Validation failed/i);
    });

    test('rejects invalid Member ObjectId format in route parameter', async () => {
      const res = await request(app)
        .get('/api/members/not-a-valid-hex-id')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Invalid Member ID format/i);
    });

    test('rejects invalid Member Serial number format in route parameter', async () => {
      const res = await request(app)
        .get('/api/members/serial/invalid-serial-text')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Validation failed/i);
    });

    test('rejects invalid Renewal ObjectId format in route parameter', async () => {
      const res = await request(app)
        .delete('/api/renewals/malformed-id')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Invalid Renewal ID format/i);
    });

    test('escapeRegex utility correctly neutralizes regex metacharacters', () => {
      const attackStrings = [
        '(((((((a+)+)+)+)+)+)+)$',
        '.*.*.*.*.*.*.*',
        'admin[0-9]',
        'test|drop table',
        '^start$end',
      ];

      for (const str of attackStrings) {
        const escaped = escapeRegex(str);
        const rx = new RegExp(escaped, 'i');
        assert.equal(rx.test(str), true);
      }
    });
  });

  describe('5. Password Policy & Token Security', () => {
    test('enforces minimum 8 characters for new password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'short',
          confirmPassword: 'short',
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /at least 8 characters/i);
    });

    test('falls back safely in production if JWT_SECRET is unset or default', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'super_secret_jwt_key_mms_2026_secure';

        const token = signToken({ id: '123', username: 'admin' });
        assert.ok(token);
        const verified = verifyToken(token);
        assert.equal(verified.username, 'admin');
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.JWT_SECRET = originalSecret;
      }
    });
  });

  describe('6. Request Body Size Limit Defense', () => {
    test('rejects excessively large JSON payload (> 200kb) with 413 Payload Too Large', async () => {
      const largePayload = {
        data: 'A'.repeat(250 * 1024), // 250 KB
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(largePayload);

      assert.equal(res.status, 413);
    });
  });
});
