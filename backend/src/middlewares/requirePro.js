export const requirePro = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (req.user.plan === "PRO" || req.user.subscriptionPlan === "pro") {
            next();
        } else {
            return res.status(403).json({ message: "This feature requires a PRO subscription" });
        }
    } catch (error) {
        console.error("Error in requirePro middleware:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
