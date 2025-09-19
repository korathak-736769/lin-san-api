export function successResponse(res, statusCode = 200, message, data = null) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

export function errorResponse(res, statusCode = 400, message, errors = null) {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
}