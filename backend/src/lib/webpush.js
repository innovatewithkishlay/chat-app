import webpush from "web-push";
import dotenv from "dotenv";

dotenv.config();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("VAPID keys are missing. Push notifications will not work.");
}

export default webpush;
