import LinkModel from '../models/link.model.js';
import { SHORT_CODE_LENGTH } from '../configs/environment.js';

function generateShortCode(length = SHORT_CODE_LENGTH) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export async function generateUniqueShortCode() {
    let shortCode;
    let isUnique = false;

    while (!isUnique) {
        shortCode = generateShortCode();
        const existingLink = await LinkModel.findOne({ short_code: shortCode });
        if (!existingLink) {
            isUnique = true; 
        }
    }
    return shortCode;
}

