import linkModel from "../models/link.model.js";
import { generateUniqueShortCode } from "../utils/link.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getHisClickLinks = async (req, res) => {
    try {
        const { short_code } = req.params;
        const link = await linkModel.findOne({ short_code });

        if (!link) {
            return errorResponse(res, 404, "Link not found");
        }

        const his_clicks = link.his_clicks || [];
        const his_clicks_total = his_clicks.length || 0;
        const clean_his_clicks = his_clicks.map(click => click.clicked_at);


        successResponse(res, 200, "Link fetched successfully", { his_clicks_total, clean_his_clicks });
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, "Server error");
    }
};

export const createLink = async (req, res) => {
    try {
        const { long_url } = req.body;
        const short_code = await generateUniqueShortCode();
        const newLink = new linkModel({ long_url, short_code });
        await newLink.save();
        successResponse(res, 201, "Link created successfully", newLink);
    } catch (error) {
        console.error(error);
        errorResponse(res, 500, "Server error");
    }
};

export const redirectToLongUrl = async (req, res) => {
    try {
        const { short_code } = req.params;

        const link = await linkModel.findOne({ short_code });

        if (!link) {
            return errorResponse(res, 404, 'link not found');
        }

        const getClientIP = (req) => {
            return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-real-ip'] ||
                req.headers['x-client-ip'] ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                req.ip ||
                'unknown';
        };

        const clickData = {
            user_agent: req.headers['user-agent'],
            ip_address: getClientIP(req),
        };

        await linkModel.updateOne(
            { _id: link._id },
            { $push: { his_clicks: clickData } }
        );

        return res.redirect(link.long_url);

    } catch (error) {
        console.error(error);
        errorResponse(res, 500, "Server error");
    }
};