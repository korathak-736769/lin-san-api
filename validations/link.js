import { z } from 'zod';
import { SHORT_CODE_LENGTH } from '../configs/environment.js';

const validateNoXSS = (url) => {
    const xssPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /data:/gi,
        /vbscript:/gi,
        /onload/gi,
        /onerror/gi,
        /onclick/gi,
        /onmouseover/gi,
        /onfocus/gi,
        /onblur/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<form/gi,
        /eval\(/gi,
        /alert\(/gi,
        /confirm\(/gi,
        /prompt\(/gi
    ];
    
    return !xssPatterns.some(pattern => pattern.test(url));
};

const validateSafeDomain = (url) => {
    const allowedProtocols = ['http:', 'https:'];
    
    try {
        const urlObj = new URL(url);
        return allowedProtocols.includes(urlObj.protocol);
    } catch {
        return false;
    }
};

export const createLinkSchema = z.object({
    body: z.object({
        long_url: z
            .string({ required_error: 'Please provide long_url' })
            .min(1, { message: 'long_url cannot be empty' })
            .url({ message: 'Invalid URL format' })
            .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
                message: 'URL must start with http:// or https://'
            })
            .refine(validateNoXSS, {
                message: 'URL contains potentially dangerous content'
            })
            .refine(validateSafeDomain, {
                message: 'URL protocol not allowed'
            })
            .refine((url) => {
                return url.length <= 2048;
            }, {
                message: 'URL is too long (max 2048 characters)'
            }),
    }),
});

export const shortCodeSchema = z.object({
    params: z.object({
        short_code: z
            .string({ required_error: 'Please provide short_code' })
            .min(SHORT_CODE_LENGTH, { message: `short_code must be ${SHORT_CODE_LENGTH} characters long` })
            .max(SHORT_CODE_LENGTH, { message: `short_code must be ${SHORT_CODE_LENGTH} characters long` })
            .regex(/^[A-Za-z0-9]+$/, { 
                message: 'short_code can only contain letters (A-Z, a-z) and numbers (0-9)' 
            }),
    }),
});

