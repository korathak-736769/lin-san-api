import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import linkRoutes from '../../routes/link.route.js';
import LinkModel from '../../models/link.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';

jest.mock('../../configs/environment.js', () => ({
    SHORT_CODE_LENGTH: 4
}));

describe('Link Routes Integration', () => {
    let app;

    beforeAll(async () => {
        await setupTestDB();

        app = express();
        app.use(express.json());
        app.use('/link', linkRoutes);
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
    });

    describe('POST /link', () => {
        test('should create a new link', async () => {
            const response = await request(app)
                .post('/link')
                .send({ long_url: 'https://example.com' })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Link created successfully');
            expect(response.body.data).toHaveProperty('long_url', 'https://example.com');
            expect(response.body.data).toHaveProperty('short_code');
        });

        test('should reject invalid URL', async () => {
            const response = await request(app)
                .post('/link')
                .send({ long_url: 'invalid-url' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid input data');
        });

        test('should reject missing long_url', async () => {
            const response = await request(app)
                .post('/link')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid input data');
        });
    });

    describe('GET /link/his/:short_code', () => {
        test('should get click history for existing link', async () => {
            const testLink = new LinkModel({
                long_url: 'https://example.com',
                short_code: 'TEST',
                his_clicks: [
                    {
                        user_agent: 'Mozilla/5.0',
                        ip_address: '192.168.1.1',
                        clicked_at: new Date()
                    }
                ]
            });
            await testLink.save();

            const response = await request(app)
                .get('/link/his/TEST')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.his_clicks_total).toBe(1);
            expect(response.body.data.clean_his_clicks).toHaveLength(1);
        });

        test('should return 404 for non-existing link', async () => {
            const response = await request(app)
                .get('/link/his/NOPE')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Link not found');
        });
    });

    describe('GET /link/:short_code', () => {
        test('should redirect to long URL', async () => {
            const testLink = new LinkModel({
                long_url: 'https://example.com',
                short_code: 'TEST'
            });
            await testLink.save();

            const response = await request(app)
                .get('/link/TEST')
                .expect(302);

            expect(response.headers.location).toBe('https://example.com');
        });

        test('should return 404 for non-existing short code', async () => {
            const response = await request(app)
                .get('/link/NOPE')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('link not found');
        });

        test('should reject invalid short code format', async () => {
            const response = await request(app)
                .get('/link/ab')  // Too short
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid input data');
        });
    });
});