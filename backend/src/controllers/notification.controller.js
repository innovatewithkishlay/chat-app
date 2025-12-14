import Subscription from "../models/subscription.model.js";

export const subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const userId = req.user._id;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ message: "Invalid subscription" });
        }

        // Check if subscription already exists
        const existing = await Subscription.findOne({ endpoint: subscription.endpoint });
        if (existing) {
            // Update user if changed (e.g. different user logged in on same device)
            if (existing.userId.toString() !== userId.toString()) {
                existing.userId = userId;
                await existing.save();
            }
            return res.status(200).json({ message: "Subscription updated" });
        }

        const newSubscription = new Subscription({
            userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
        });

        await newSubscription.save();

        res.status(201).json({ message: "Subscribed successfully" });
    } catch (error) {
        console.error("Error in subscribe:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getConfig = (req, res) => {
    res.status(200).json({ vapidPublicKey: process.env.VAPID_PUBLIC_KEY });
};
