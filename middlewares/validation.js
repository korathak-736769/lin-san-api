
import { z } from "zod";
import { errorResponse } from "../utils/response.js"

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorDetails = error.issues || error.errors || [];
            return errorResponse(res, 400, 'Invalid input data',
                        errorDetails.map(e => e.message)
                    );
        }
        return errorResponse(res, 500, 'Validation error', { error: error.message });
    }
};