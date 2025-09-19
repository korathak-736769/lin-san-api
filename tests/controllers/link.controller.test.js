import mongoose from 'mongoose';
import { createLink, getHisClickLinks, redirectToLongUrl } from '../../controllers/link.controller.js';
import LinkModel from '../../models/link.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';

// Mock the utils
jest.mock('../../utils/link.js', () => ({
    generateUniqueShortCode: jest.fn(() => Promise.resolve('ABCD'))
}));

describe('Link Controller', () => {
    let mockReq, mockRes;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        mockReq = {
            body: {},
            params: {},
            headers: {},
            ip: '192.168.1.1'
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis()
        };
    });

    describe('createLink', () => {
        test('should create a new link successfully', async () => {
            mockReq.body = { long_url: 'https://example.com' };

            await createLink(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Link created successfully',
                data: expect.objectContaining({
                    long_url: 'https://example.com',
                    short_code: 'ABCD'
                })
            });

            // Verify link was saved to database
            const savedLink = await LinkModel.findOne({ short_code: 'ABCD' });
            expect(savedLink).toBeTruthy();
            expect(savedLink.long_url).toBe('https://example.com');
        });

        test('should handle database errors', async () => {
            // Mock a database error by using invalid data
            jest.spyOn(LinkModel.prototype, 'save').mockRejectedValueOnce(new Error('Database error'));

            mockReq.body = { long_url: 'https://example.com' };

            await createLink(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error',
                errors: null
            });

            // Restore the mock
            LinkModel.prototype.save.mockRestore();
        });
    });

    describe('getHisClickLinks', () => {
        test('should return click history for existing link', async () => {
            // Create a test link with click history
            const testLink = new LinkModel({
                long_url: 'https://example.com',
                short_code: 'TEST',
                his_clicks: [
                    {
                        user_agent: 'Mozilla/5.0',
                        ip_address: '192.168.1.1',
                        clicked_at: new Date('2023-01-01')
                    },
                    {
                        user_agent: 'Chrome',
                        ip_address: '192.168.1.2',
                        clicked_at: new Date('2023-01-02')
                    }
                ]
            });
            await testLink.save();

            mockReq.params = { short_code: 'TEST' };

            await getHisClickLinks(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Link fetched successfully',
                data: {
                    his_clicks_total: 2,
                    clean_his_clicks: [
                        new Date('2023-01-01'),
                        new Date('2023-01-02')
                    ]
                }
            });
        });

        test('should return 404 for non-existing link', async () => {
            mockReq.params = { short_code: 'NOPE' };

            await getHisClickLinks(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Link not found',
                errors: null
            });
        });

        test('should handle links with empty click history', async () => {
            const testLink = new LinkModel({
                long_url: 'https://example.com',
                short_code: 'EMPT'
            });
            await testLink.save();

            mockReq.params = { short_code: 'EMPT' };

            await getHisClickLinks(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: 'Link fetched successfully',
                data: {
                    his_clicks_total: 0,
                    clean_his_clicks: []
                }
            });
        });
    });

    describe('redirectToLongUrl', () => {
        test('should redirect to long URL and record click', async () => {
            const testLink = new LinkModel({
                long_url: 'https://example.com',
                short_code: 'REDI'
            });
            await testLink.save();

            mockReq.params = { short_code: 'REDI' };
            mockReq.headers = { 'user-agent': 'Mozilla/5.0' };
            mockReq.ip = '192.168.1.1';

            await redirectToLongUrl(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com');

            // Verify click was recorded
            const updatedLink = await LinkModel.findOne({ short_code: 'REDI' });
            expect(updatedLink.his_clicks).toHaveLength(1);
            expect(updatedLink.his_clicks[0].user_agent).toBe('Mozilla/5.0');
            expect(updatedLink.his_clicks[0].ip_address).toBe('192.168.1.1');
        });

        test('should return 404 for non-existing short code', async () => {
            mockReq.params = { short_code: 'NOPE' };

            await redirectToLongUrl(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'link not found',
                errors: null
            });
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });

        test('should handle database errors during click recording', async () => {
            const testLink = new LinkModel({
                long_url: 'https://example.com',
                short_code: 'ERRO'
            });
            await testLink.save();

            // Mock a database error during update
            jest.spyOn(LinkModel, 'updateOne').mockRejectedValueOnce(new Error('Database error'));

            mockReq.params = { short_code: 'ERRO' };
            mockReq.headers = { 'user-agent': 'Mozilla/5.0' };

            await redirectToLongUrl(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error',
                errors: null
            });

            // Restore the mock
            LinkModel.updateOne.mockRestore();
        });
    });
});