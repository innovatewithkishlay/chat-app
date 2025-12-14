import CallHistory from "../models/callHistory.model.js";

export const getCallHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const history = await CallHistory.find({
            participants: userId,
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
