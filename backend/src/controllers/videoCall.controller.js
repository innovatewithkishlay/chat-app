import User from "../models/user.model.js";
import { canUseVideoCall } from "../lib/utils.js";

export const checkEligibility = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const callerId = req.user._id;

        const caller = await User.findById(callerId);
        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!canUseVideoCall(caller)) {
            return res.status(403).json({ message: "Upgrade to Pro to use video calling" });
        }

        if (!canUseVideoCall(receiver)) {
            return res.status(403).json({ message: "The other user is not eligible for video calls" });
        }

        res.status(200).json({ eligible: true });
    } catch (error) {
        console.error("Error in checkEligibility:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
