import { getCollection } from "../config/db.js";

const analytics = () => getCollection("analytics");

export const createAnalyticsEvent = async ({ eventType = "eligibility_check", responseTimeMs }) => {
  await analytics().insertOne({
    eventType,
    responseTimeMs,
    createdAt: new Date()
  });
};

export const countAnalyticsEvents = async (eventType) => analytics().countDocuments({ eventType });

export const aggregateAnalytics = async (pipeline) => analytics().aggregate(pipeline).toArray();
