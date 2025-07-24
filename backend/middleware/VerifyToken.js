import jwt from "jsonwebtoken";
import Users from "../models/UserModel.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ msg: "No token provided" });

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Invalid authorization format" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Verifikasi user masih ada di database
    const user = await Users.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ msg: "User tidak ditemukan" });
    }

    req.user = {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired" });
    }
    return res.status(403).json({ msg: "Invalid token" });
  }
};