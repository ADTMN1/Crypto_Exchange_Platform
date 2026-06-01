import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
// Helper to generate the long-lived Refresh Tok

export const generateToken = async(userId,email, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }
   const accessToken =  jwt.sign(
    { id: userId, email: email, role: role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } 
  );

  return accessToken;
};

export const refreshToken = async(userId,email, role) => {
  // 1. Get token from cookies (requires cookie-parser middleware)
  try {
   if (!process.env.REFRESH_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }

    const refreshToken = jwt.sign(
      { id: userId, email: email, role: role },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" } // 7 days
    );


    return refreshToken;
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};