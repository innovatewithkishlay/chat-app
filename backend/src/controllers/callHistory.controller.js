import CallHistory from "../models/callHistory.model.js";

export const getCallHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const history = await CallHistory.find({
            participants: userId,
            deletedFor: { $ne: userId }, // Filter out deleted calls
        })
            .populate("caller", "fullname profilePic")
            .populate("receiver", "fullname profilePic")
            .sort({ createdAt: -1 });

        res.status(200).json(history);
    } catch (error) {
        console.error("Error in getCallHistory:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const clearCallHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        // Mark all my calls as deletedFor me
        await CallHistory.updateMany(
            { participants: userId },
            { $addToSet: { deletedFor: userId } }
        );

        res.status(200).json({ message: "Call history cleared" });
    } catch (error) {
        console.error("Error in clearCallHistory:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
