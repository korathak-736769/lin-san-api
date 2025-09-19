import mongoose from "mongoose";

const clickSchema = new mongoose.Schema({
    user_agent: { type: String },
    ip_address: { type: String },
    clicked_at: { type: Date, default: Date.now },
}, { _id: false });

const linkSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    long_url: { type: String, required: true },
    short_code: { type: String, required: true, unique: true },
    his_clicks: { type: [clickSchema], default: [] }
}, { timestamps: true, versionKey: false });

linkSchema.index({ _id: 1, long_url: 1, short_code: 1 });


export default mongoose.model("links", linkSchema);