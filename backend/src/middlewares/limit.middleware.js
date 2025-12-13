import User from "../models/user.model.js";
import { LIMITS } from "../lib/limits.config.js";

export const checkUploadLimits = async (req, res, next) => {
    try {
        const { image, video } = req.body;

        // If no media, skip checks
        if (!image && !video) {
            return next();
        }

        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if usage needs reset (new day)
        const now = new Date();
        const lastReset = new Date(user.lastUsageReset);
        const isNewDay =
            now.getDate() !== lastReset.getDate() ||
            now.getMonth() !== lastReset.getMonth() ||
            now.getFullYear() !== lastReset.getFullYear();

        if (isNewDay) {
            user.usage = { imagesSent: 0, videosSent: 0 };
            user.lastUsageReset = now;
            await user.save();
        }

        const userPlan = user.plan || "FREE";
        const limits = LIMITS[userPlan];

        if (image) {
            if (user.usage.imagesSent >= limits.IMAGES_PER_DAY) {
                return res.status(403).json({
                    message: `Daily image limit reached for ${userPlan} plan. Upgrade to PRO for more.`,
                });
            }
        }

        if (video) {
            if (limits.VIDEOS_PER_DAY === 0) {
                return res.status(403).json({
                    message: `Video sending is not available on ${userPlan} plan. Upgrade to PRO.`,
                });
            }
            if (user.usage.videosSent >= limits.VIDEOS_PER_DAY) {
                return res.status(403).json({
                    message: `Daily video limit reached for ${userPlan} plan. Upgrade to PRO for more.`,
                });
            }
        }

        // Attach user to req for next steps
        req.userWithLimits = user;
        next();
    } catch (error) {
        console.log("Error in checkUploadLimits middleware:", error);
        res.status(500).json({ message: "Internal server error checking limits" });
    }
};

export const incrementUsage = async (userId, resourceType) => {
    try {
        const update = {};
        if (resourceType === "image") {
            update["usage.imagesSent"] = 1;
        } else if (resourceType === "video") {
            update["usage.videosSent"] = 1;
        }

        await User.findByIdAndUpdate(userId, { $inc: update });
    } catch (error) {
        console.log("Error incrementing usage:", error);
    }
};
