import { successResponse, errorResponse } from '../../utils/response.js';

describe('Response Utils', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('successResponse', () => {
        test('should return success response with default status code', () => {
            const message = 'Operation successful';
            const data = { id: 1, name: 'test' };

            successResponse(mockRes, undefined, message, data);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message,
                data
            });
        });

        test('should return success response with custom status code', () => {
            const message = 'Created successfully';
            const data = { id: 1 };

            successResponse(mockRes, 201, message, data);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message,
                data
            });
        });

        test('should return success response without data', () => {
            const message = 'Operation successful';

            successResponse(mockRes, 200, message);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message,
                data: null
            });
        });
    });

    describe('errorResponse', () => {
        test('should return error response with default status code', () => {
            const message = 'Operation failed';
            const errors = ['Invalid input'];

            errorResponse(mockRes, undefined, message, errors);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message,
                errors
            });
        });

        test('should return error response with custom status code', () => {
            const message = 'Not found';
            const errors = ['Resource not found'];

            errorResponse(mockRes, 404, message, errors);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message,
                errors
            });
        });

        test('should return error response without errors', () => {
            const message = 'Server error';

            errorResponse(mockRes, 500, message);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message,
                errors: null
            });
        });
    });
});