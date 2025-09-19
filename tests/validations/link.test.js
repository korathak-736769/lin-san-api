import { createLinkSchema, shortCodeSchema } from '../../validations/link.js';

// Mock the environment config
jest.mock('../../configs/environment.js', () => ({
    SHORT_CODE_LENGTH: 4
}));

describe('Link Validations', () => {
    describe('createLinkSchema', () => {
        test('should validate valid URL', () => {
            const validData = {
                body: {
                    long_url: 'https://example.com'
                }
            };

            expect(() => createLinkSchema.parse(validData)).not.toThrow();
        });

        test('should accept http URLs', () => {
            const validData = {
                body: {
                    long_url: 'http://example.com'
                }
            };

            expect(() => createLinkSchema.parse(validData)).not.toThrow();
        });

        test('should reject empty URL', () => {
            const invalidData = {
                body: {
                    long_url: ''
                }
            };

            expect(() => createLinkSchema.parse(invalidData)).toThrow();
        });

        test('should reject invalid URL format', () => {
            const invalidData = {
                body: {
                    long_url: 'not-a-url'
                }
            };

            expect(() => createLinkSchema.parse(invalidData)).toThrow();
        });

        test('should reject URLs without http/https protocol', () => {
            const invalidData = {
                body: {
                    long_url: 'ftp://example.com'
                }
            };

            expect(() => createLinkSchema.parse(invalidData)).toThrow();
        });

        test('should reject URLs with XSS content', () => {
            const invalidData = {
                body: {
                    long_url: 'https://example.com/<script>alert("xss")</script>'
                }
            };

            expect(() => createLinkSchema.parse(invalidData)).toThrow();
        });

        test('should reject URLs with javascript protocol', () => {
            const invalidData = {
                body: {
                    long_url: 'javascript:alert("xss")'
                }
            };

            expect(() => createLinkSchema.parse(invalidData)).toThrow();
        });

        test('should reject URLs that are too long', () => {
            const longUrl = 'https://example.com/' + 'x'.repeat(2100);
            const invalidData = {
                body: {
                    long_url: longUrl
                }
            };

            expect(() => createLinkSchema.parse(invalidData)).toThrow();
        });

        test('should reject missing long_url', () => {
            const invalidData = {
                body: {}
            };

            expect(() => createLinkSchema.parse(invalidData)).toThrow();
        });
    });

    describe('shortCodeSchema', () => {
        test('should validate valid short code', () => {
            const validData = {
                params: {
                    short_code: 'ab12'
                }
            };

            expect(() => shortCodeSchema.parse(validData)).not.toThrow();
        });

        test('should accept alphanumeric characters', () => {
            const validData = {
                params: {
                    short_code: 'A1c3'
                }
            };

            expect(() => shortCodeSchema.parse(validData)).not.toThrow();
        });

        test('should reject short code that is too short', () => {
            const invalidData = {
                params: {
                    short_code: 'ab'
                }
            };

            expect(() => shortCodeSchema.parse(invalidData)).toThrow();
        });

        test('should reject short code that is too long', () => {
            const invalidData = {
                params: {
                    short_code: 'abc12'
                }
            };

            expect(() => shortCodeSchema.parse(invalidData)).toThrow();
        });

        test('should reject short code with special characters', () => {
            const invalidData = {
                params: {
                    short_code: 'ab-1'
                }
            };

            expect(() => shortCodeSchema.parse(invalidData)).toThrow();
        });

        test('should reject short code with spaces', () => {
            const invalidData = {
                params: {
                    short_code: 'ab 1'
                }
            };

            expect(() => shortCodeSchema.parse(invalidData)).toThrow();
        });

        test('should reject missing short_code', () => {
            const invalidData = {
                params: {}
            };

            expect(() => shortCodeSchema.parse(invalidData)).toThrow();
        });
    });
});