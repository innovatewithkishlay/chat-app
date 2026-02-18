import razorpay from "../lib/razorpay.js";
import User from "../models/user.model.js";

export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;

        // Optional: Check if already PRO
        const user = await User.findById(userId);
        if (user.subscriptionPlan === "pro") {
            return res.status(400).json({ message: "User is already PRO" });
        }

        const options = {
            amount: 49900, // ₹499.00 in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}_${userId.toString().slice(-4)}`,
            payment_capture: 1 // Auto capture
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ message: "Failed to create Razorpay order" });
        }

        // Save order ID temporarily if needed, or just return it
        user.razorpayOrderId = order.id;
        await user.save();

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID // Send key to frontend
        });

    } catch (error) {
        console.error("Error in createOrder:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

import crypto from "crypto";

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user._id;

        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        const generated_signature = crypto
            .createHmac("sha256", key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature === razorpay_signature) {
            // Payment is successful
            const user = await User.findById(userId);

            user.subscriptionPlan = "pro";
            user.subscriptionStatus = "active";
            user.plan = "PRO"; // Sync with frontend access control
            user.razorpayPaymentId = razorpay_payment_id;
            user.razorpayOrderId = razorpay_order_id;

            await user.save();
            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                user: {
                    _id: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    profilePic: user.profilePic,
                    plan: user.plan, // Old field if used
                    subscriptionPlan: user.subscriptionPlan // New field
                }
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }

    } catch (error) {
        console.error("Error in verifyPayment:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
