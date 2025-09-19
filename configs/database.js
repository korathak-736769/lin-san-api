import { connect } from "mongoose";
import { MONGODB_URI } from "./environment.js"

const connectDB = async () => {

    try {
        const connectionOptions = {
            dbName: "LinSanDB",
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false
        };

        await connect(MONGODB_URI, connectionOptions);
        console.log("Connected Database successfully!");

    } catch (err) {
        console.error("Connection error:", err);
        process.exit(1);
    }
};

export default connectDB;