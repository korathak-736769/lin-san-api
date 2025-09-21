import express from "express";
import fs from "fs";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";

import connectDB from "./configs/database.js";
import { PORT } from "./configs/environment.js";

const app = express();

// Trust proxy settings for getting real client IP
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database connection
let dbConnected = false;
const initDB = async () => {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
        } catch (error) {
            console.error("Database connection failed:", error);
        }
    }
};

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        await initDB(); // Ensure DB is connected
        
        // Check database connection
        const mongoose = await import('mongoose');
        const dbState = mongoose.default.connection.readyState;
        
        const healthStatus = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbState === 1 ? 'connected' : 'disconnected',
            version: process.env.npm_package_version || '1.0.0',
            node: process.version
        };
        
        res.status(200).json(healthStatus);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Load routes dynamically
const loadRoutes = async () => {
    try {
        const routeFiles = fs.readdirSync("./routes")
            .filter((file) => file.endsWith(".route.js"));
        
        for (const file of routeFiles) {
            const routeModule = await import(`./routes/${file}`);
            const route = routeModule.default;
            app.use(async (req, res, next) => {
                await initDB(); // Ensure DB is connected for each request
                route(req, res, next);
            });
        }
    } catch (error) {
        console.error("Route loading failed:", error);
    }
};

// Load routes
loadRoutes();

// For local development only
if (!process.env.VERCEL && !process.env.NODE_ENV?.includes('production')) {
    app.listen(PORT || 3000, () => {
        console.log(`Server is running on HTTP port: ${PORT || 3000}`);
    });
}

// Export for Vercel serverless
export default app;