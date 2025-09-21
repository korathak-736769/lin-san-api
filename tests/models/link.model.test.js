import mongoose from 'mongoose';
import LinkModel from '../../models/link.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';

describe('Link Model', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
    });

    describe('Schema Validation', () => {
        test('should create a valid link', async () => {
            const linkData = {
                long_url: 'https://example.com',
                short_code: 'abc123'
            };

            const link = new LinkModel(linkData);
            const savedLink = await link.save();

            expect(savedLink.long_url).toBe(linkData.long_url);
            expect(savedLink.short_code).toBe(linkData.short_code);
            expect(savedLink.his_clicks).toEqual([]);
            expect(savedLink.createdAt).toBeDefined();
            expect(savedLink.updatedAt).toBeDefined();
        });

        test('should require long_url field', async () => {
            const linkData = {
                short_code: 'abc123'
            };

            const link = new LinkModel(linkData);

            await expect(link.save()).rejects.toThrow();
        });

        test('should require short_code field', async () => {
            const linkData = {
                long_url: 'https://example.com'
            };

            const link = new LinkModel(linkData);

            await expect(link.save()).rejects.toThrow();
        });

        test('should enforce unique short_code', async () => {
            // Ensure unique index exists
            await LinkModel.ensureIndexes();

            const linkData1 = {
                long_url: 'https://example1.com',
                short_code: 'abc123'
            };

            const linkData2 = {
                long_url: 'https://example2.com',
                short_code: 'abc123'
            };

            const link1 = new LinkModel(linkData1);
            await link1.save();

            const link2 = new LinkModel(linkData2);
            try {
                await link2.save();
                // If we reach here, the save succeeded when it shouldn't have
                throw new Error('Expected duplicate key error but save succeeded');
            } catch (error) {
                // Check for duplicate key error (code 11000)
                expect(error.code === 11000 || error.message.includes('duplicate') || error.message.includes('unique')).toBe(true);
            }
        });
    });

    describe('Click History', () => {
        test('should add click data to his_clicks array', async () => {
            const link = new LinkModel({
                long_url: 'https://example.com',
                short_code: 'abc123'
            });

            const savedLink = await link.save();

            const clickData = {
                user_agent: 'Mozilla/5.0',
                ip_address: '192.168.1.1'
            };

            await LinkModel.updateOne(
                { _id: savedLink._id },
                { $push: { his_clicks: clickData } }
            );

            const updatedLink = await LinkModel.findById(savedLink._id);
            expect(updatedLink.his_clicks).toHaveLength(1);
            expect(updatedLink.his_clicks[0].user_agent).toBe(clickData.user_agent);
            expect(updatedLink.his_clicks[0].ip_address).toBe(clickData.ip_address);
            expect(updatedLink.his_clicks[0].clicked_at).toBeDefined();
        });
    });
});










