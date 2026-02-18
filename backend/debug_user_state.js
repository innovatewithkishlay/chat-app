import mongoose from "mongoose";
import User from "./src/models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const debugUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // Find the user (assuming only one or first one for now, or I'll list all)
        const users = await User.find({});

        users.forEach(u => {
            console.log(`User: ${u.fullname} (${u.email})`);
            console.log(`  _id: ${u._id}`);
            console.log(`  plan: ${u.plan}`);
            console.log(`  subscriptionPlan: ${u.subscriptionPlan}`);
            console.log(`  subscriptionStatus: ${u.subscriptionStatus}`);
            console.log("-------------------");
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

debugUser();
