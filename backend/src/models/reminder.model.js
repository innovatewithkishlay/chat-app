import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            required: true,
        },
        remindAt: {
            type: Date,
            required: true,
        },
        isNotified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
