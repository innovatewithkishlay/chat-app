import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "4d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "none",
    maxAge: 4 * 24 * 60 * 60 * 1000,
    secure: true,
  });

  return token;
};

export const canUseVideoCall = (user) => {
  return user.plan === "PRO";
};
