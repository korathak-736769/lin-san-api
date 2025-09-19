import mongoose from 'mongoose';
import { generateUniqueShortCode } from '../../utils/link.js';
import LinkModel from '../../models/link.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';

// Mock the environment config
jest.mock('../../configs/environment.js', () => ({
    SHORT_CODE_LENGTH: 4
}));

describe('Link Utils', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
    });

    describe('generateUniqueShortCode', () => {
        test('should generate a unique short code', async () => {
            const shortCode = await generateUniqueShortCode();

            expect(shortCode).toBeDefined();
            expect(typeof shortCode).toBe('string');
            expect(shortCode).toHaveLength(4);
            expect(/^[A-Za-z0-9]+$/.test(shortCode)).toBe(true);
        });

        test('should generate different codes on multiple calls', async () => {
            const shortCode1 = await generateUniqueShortCode();
            const shortCode2 = await generateUniqueShortCode();

            expect(shortCode1).not.toBe(shortCode2);
        });

        test('should avoid existing short codes in database', async () => {
            // Create a link with a known short code
            const existingLink = new LinkModel({
                long_url: 'https://example.com',
                short_code: 'ABC123'
            });
            await existingLink.save();

            // Generate a new unique short code
            const newShortCode = await generateUniqueShortCode();

            expect(newShortCode).not.toBe('ABC123');

            // Verify the new code doesn't exist in database
            const found = await LinkModel.findOne({ short_code: newShortCode });
            expect(found).toBeNull();
        });
    });
});