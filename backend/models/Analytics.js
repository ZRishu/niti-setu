import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema({
    eventType: {
        type: String,
        default: 'eligibility_check'
    },
    responseTimeMs: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Analytics', AnalyticsSchema);