import mongoose from "mongoose";
import User from "./src/models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const fixUserState = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const result = await User.updateMany(
            { subscriptionPlan: "pro", plan: "FREE" },
            { $set: { plan: "PRO" } }
        );

        console.log(`Updated ${result.modifiedCount} users to PRO plan.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

fixUserState();
