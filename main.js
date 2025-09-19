import express from "express";
import fs from "fs";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";

import connectDB from "./configs/database.js";
import { PORT } from "./configs/environment.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
    await connectDB();

    app.use(morgan("dev"));
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.get("/health", (req, res) => {
        res.status(200).send("OK");
    });

    const routeFiles = fs.readdirSync("./routes")
        .filter((file) => file.endsWith(".route.js"));
    
    for (const file of routeFiles) {
        const routeModule = await import(`./routes/${file}`);
        const route = routeModule.default;
        const prefix = `/${file.replace(".route.js", "")}`;
        app.use(prefix, route);
    }

    app.listen(PORT, () => {
        console.log(`Server is running on HTTP port: ${PORT}`);
    });
})();