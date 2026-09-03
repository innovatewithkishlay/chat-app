// One-off utility: generates a VAPID key pair for Web Push notifications.
// Run with: node scripts/generate-vapid-keys.js
// Copy the output into VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in your .env
import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log("VAPID_PUBLIC_KEY=" + publicKey);
console.log("VAPID_PRIVATE_KEY=" + privateKey);
