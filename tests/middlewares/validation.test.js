import { validate } from '../../middlewares/validation.js';
import { z } from 'zod';

describe('Validation Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {},
            query: {},
            params: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
    });

    test('should call next() when validation passes', () => {
        const schema = z.object({
            body: z.object({
                name: z.string()
            })
        });

        mockReq.body = { name: 'test' };

        const middleware = validate(schema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should return error when validation fails', () => {
        const schema = z.object({
            body: z.object({
                name: z.string()
            })
        });

        mockReq.body = { name: 123 }; // Invalid type

        const middleware = validate(schema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid input data',
            errors: expect.any(Array)
        });
    });

    test('should handle non-Zod errors', () => {
        const schema = {
            parse: () => {
                throw new Error('Custom error');
            }
        };

        const middleware = validate(schema);
        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            message: 'Validation error',
            errors: { error: 'Custom error' }
        });
    });
});