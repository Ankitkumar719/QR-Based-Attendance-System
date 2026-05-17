import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (!token) {
    console.warn('authMiddleware: no token present on request', { path: req.originalUrl, method: req.method });
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = verifyToken(token);
    console.debug('authMiddleware: token decoded', { decoded });
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      console.warn('authMiddleware: token valid but user not found', { userId: decoded.id });
      return res.status(401).json({ message: "Invalid token user" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('authMiddleware: token verification failed', err && err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
