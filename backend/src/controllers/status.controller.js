import User from "../models/user.model.js";
import Status from "../models/status.model.js";
import cloudinary from "../lib/cloudinary.js";
import { redisClient } from "../lib/redis.js"; // Import Redis
import { io, getReceiverSocketId } from "../lib/socket.js"; // Import Socket.IO

// 1. Create Status (PRO Only)
export const createStatus = async (req, res) => {
    try {
        const { type, content, color, privacy } = req.body;
        const userId = req.user._id;

        // A. Check Plan
        const user = await User.findById(userId);
        if (user.plan !== "PRO") {
            return res.status(403).json({ message: "Status feature is for PRO users only." });
        }

        let statusContent = content;

        // B. Handle Media Upload
        if (type === "image" || type === "video") {
            if (!content) return res.status(400).json({ message: "Content is required" });

            const uploadResponse = await cloudinary.uploader.upload(content, {
                resource_type: type === "video" ? "video" : "image",
                folder: "status_updates"
            });
            statusContent = uploadResponse.secure_url;
        }

        // C. Create New Story Item
        const newStory = {
            type,
            content: statusContent,
            color: type === "text" ? color : null,
            createdAt: new Date(),
        };

        // D. Upsert Status Document
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const status = await Status.findOneAndUpdate(
            { userId },
            {
                $push: { stories: newStory },
                $set: {
                    expiresAt,
                    privacy: privacy || "friends"
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Invalidate Feed Cache for friends (Complex, maybe just let them expire or invalidate self)
        // For now, we just proceed. Feed is cached for 60s.

        // E. Emit Socket Event (status:posted)
        try {
            // Find friends to notify
            // We perform a lightweight lookup or use the cached friend list if available.
            // For accuracy, we query the user's friend list.
            const userWithFriends = await User.findById(userId).select("friends");
            const friendIds = userWithFriends.friends || [];

            friendIds.forEach(friendId => {
                const socketId = getReceiverSocketId(friendId);
                if (socketId) {
                    io.to(socketId).emit("status:posted", {
                        userId,
                        username: user.username,
                        profilePic: user.profilePic,
                        hasNewStatus: true
                    });
                }
            });
        } catch (socketError) {
            console.error("Socket emission failed (status:posted):", socketError.message);
        }

        res.status(201).json(status);

    } catch (error) {
        console.error("Error in createStatus:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 2. Get Statuses (Friends + Self)
export const getStatuses = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const cacheKey = `status:feed:${userId}`;

        // A. Check Redis Cache
        const cachedFeed = await redisClient.get(cacheKey);
        if (cachedFeed) {
            return res.status(200).json(JSON.parse(cachedFeed));
        }

        // B. Logic if not cached
        const user = await User.findById(userId).select("friends");
        const friendIds = user.friends || [];

        const statuses = await Status.find({
            userId: { $in: [userId, ...friendIds] }
        })
            .populate("userId", "fullname profilePic username")
            .populate("stories.viewers.userId", "fullname profilePic")
            .lean();

        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = new Date();

        const result = statuses.map(doc => {
            const recentStories = doc.stories.filter(story => {
                const age = now - new Date(story.createdAt);
                return age < ONE_DAY;
            });

            return {
                ...doc,
                stories: recentStories
            };
        }).filter(doc => doc.stories.length > 0);

        // C. Set Redis Cache (60s TTL)
        await redisClient.set(cacheKey, JSON.stringify(result), 60);

        res.status(200).json(result);

    } catch (error) {
        console.error("Error in getStatuses:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 3. View Status
export const viewStatus = async (req, res) => {
    try {
        const { statusId, storyId } = req.body;
        const userId = req.user._id.toString(); // Viewer ID
        const me = req.user; // Viewer info for socket

        if (!statusId || !storyId) {
            return res.status(400).json({ message: "Status ID and Story ID required" });
        }

        // A. Redis Dedup
        const viewKey = `status:${storyId}:viewers`;
        const isAlreadyViewed = await redisClient.sismember(viewKey, userId);

        if (isAlreadyViewed) {
            return res.status(200).json({ message: "Already viewed (Redis)" });
        }

        // B. Update MongoDB
        const updatedStatus = await Status.findOneAndUpdate(
            {
                _id: statusId,
                "stories._id": storyId,
                "stories.viewers.userId": { $ne: userId }
            },
            {
                $push: { "stories.$.viewers": { userId, viewedAt: new Date() } },
                $inc: { "stories.$.viewerCount": 1 }
            },
            { new: true }
        );

        if (updatedStatus) {
            // C. Update Redis Set if DB update succeeded
            // This order ensures DB is source of truth.
            await redisClient.sadd(viewKey, userId);
            await redisClient.expire(viewKey, 86400); // 24h Expiry for the set

            // D. Emit Socket Event (status:viewed) -> To the Owner of the status
            try {
                const ownerId = updatedStatus.userId.toString();
                if (ownerId !== userId) {
                    const ownerSocketId = getReceiverSocketId(ownerId);
                    if (ownerSocketId) {
                        io.to(ownerSocketId).emit("status:viewed", {
                            storyId,
                            viewer: {
                                _id: userId,
                                fullname: me.fullname,
                                profilePic: me.profilePic
                            }
                        });
                    }
                }
            } catch (socketError) {
                console.error("Socket emission failed (status:viewed):", socketError.message);
            }
        }

        res.status(200).json(updatedStatus || { message: "Status not found or already viewed" });

    } catch (error) {
        console.error("Error in viewStatus:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 4. Delete Status (Own Only)
export const deleteStatus = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user._id;

        const updatedStatus = await Status.findOneAndUpdate(
            { userId },
            { $pull: { stories: { _id: storyId } } },
            { new: true }
        );

        if (!updatedStatus) {
            return res.status(404).json({ message: "Status not found" });
        }

        // Invalidate Feed Cache for self, so I don't see it anymore
        await redisClient.del(`status:feed:${userId.toString()}`);

        // E. Emit Socket Event (status:deleted)
        try {
            // Find friends to notify that a status is gone (so they verify/refresh)
            const user = await User.findById(userId).select("friends");
            const friendIds = user.friends || [];

            friendIds.forEach(friendId => {
                const socketId = getReceiverSocketId(friendId);
                if (socketId) {
                    io.to(socketId).emit("status:deleted", {
                        userId,
                        storyId
                    });
                }
            });

            // Also notify self (if using multiple devices)
            const mySocketId = getReceiverSocketId(userId);
            if (mySocketId) {
                io.to(mySocketId).emit("status:deleted", { userId, storyId });
            }

        } catch (socketError) {
            console.error("Socket emission failed (status:deleted):", socketError.message);
        }

        res.status(200).json({ message: "Story deleted successfully", status: updatedStatus });

    } catch (error) {
        console.error("Error in deleteStatus:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
