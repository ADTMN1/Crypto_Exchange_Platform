import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import AppError from "./errorHandling.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
// Helper to generate the long-lived Refresh Tok

export const generateToken = async(userId,email, role) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is missing from environment variables", 500);
  }

  try {
    const accessToken = jwt.sign(
      { id: userId, email: email, role: role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    return accessToken;
  } catch (error) {
    throw new AppError(error.message || "Failed to generate access token", 500);
  }
};

export const refreshToken = async(userId,email, role) => {
  if (!process.env.REFRESH_SECRET) {
    throw new AppError("REFRESH_SECRET is missing from environment variables", 500);
  }

  try {
    return jwt.sign(
      { id: userId, email: email, role: role },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" } // 7 days
    );
  } catch (error) {
    throw new AppError(error.message || "Failed to generate refresh token", 500);
  }
};
