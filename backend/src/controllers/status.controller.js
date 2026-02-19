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
        const { storyId } = req.body;
        const userId = req.user._id;

        if (!storyId) {
            return res.status(400).json({ message: "Story ID is required" });
        }

        // 1. Find the Status document containing this story
        const statusDoc = await Status.findOne({ "stories._id": storyId });
        if (!statusDoc) {
            return res.status(404).json({ message: "Status not found" });
        }

        // 2. Check Expiration
        if (new Date() > statusDoc.expiresAt) {
            return res.status(410).json({ message: "Status expired" });
        }

        const ownerId = statusDoc.userId.toString();

        // 3. Security Check (Owner or Friend)
        if (ownerId !== userId.toString()) {
            const owner = await User.findById(ownerId);
            const isFriend = owner.friends.includes(userId);
            if (!isFriend) {
                return res.status(403).json({ message: "Not authorized to view this status" });
            }
        }

        // 4. Atomic Update (Prevent Duplicates)
        // Only push if userId is NOT already in the viewers array for this specific story
        const updatedStatus = await Status.findOneAndUpdate(
            {
                "stories._id": storyId,
                "stories.viewers.userId": { $ne: userId }
            },
            {
                $push: {
                    "stories.$.viewers": {
                        userId,
                        viewedAt: new Date()
                    }
                },
                $inc: { "stories.$.viewerCount": 1 }
            },
            { new: true }
        ).populate("userId", "username profilePic");

        // 5. Respond & Emit Socket
        if (updatedStatus) {
            // Success - New View Added
            // Emit to Owner
            const socketId = getReceiverSocketId(ownerId);
            if (socketId && ownerId !== userId.toString()) {
                io.to(socketId).emit("status:viewed", {
                    storyId,
                    viewer: {
                        _id: userId,
                        username: req.user.username,
                        profilePic: req.user.profilePic,
                        viewedAt: new Date()
                    }
                });
            }
            return res.status(200).json({ message: "Status viewed" });
        } else {
            // No update happened implies already viewed or doc changed
            return res.status(200).json({ message: "Already viewed" });
        }

    } catch (error) {
        console.error("Error in viewStatus:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 4. Get Status Viewers (Owner Only)
export const getStatusViewers = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user._id.toString();

        // 1. Find Status
        const statusDoc = await Status.findOne({ "stories._id": storyId });

        if (!statusDoc) {
            return res.status(404).json({ message: "Status not found" });
        }

        // 2. Verify Ownership
        if (statusDoc.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // 3. Extract logic to get specific story viewers
        // We need to populate the specific story's viewers. 
        // Mongoose doesn't easily populate ONE sub-document element's array without aggregate/filtering, 
        // but since we loaded the whole doc, we can find the story and manually populate or use populate on the doc.
        // Let's populate the whole doc's stories.viewers.userId
        await statusDoc.populate("stories.viewers.userId", "username profilePic");

        const story = statusDoc.stories.find(s => s._id.toString() === storyId);
        if (!story) return res.status(404).json({ message: "Story not found" });

        // 4. Format & Sort
        const viewers = story.viewers.map(v => ({
            _id: v.userId._id,
            username: v.userId.username,
            profilePic: v.userId.profilePic,
            viewedAt: v.viewedAt
        })).sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

        res.status(200).json({
            storyId,
            totalViews: viewers.length,
            viewers
        });

    } catch (error) {
        console.error("Error in getStatusViewers:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 5. Delete Status (Own Only)
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

        // Invalidate Feed Cache for self
        await redisClient.del(`status:feed:${userId.toString()}`);

        // Emit Socket Event (status:deleted)
        try {
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
