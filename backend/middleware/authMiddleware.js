const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId }; // Attach userId to req.user
    console.log("Authenticated user ID:", req.user.userId); // Debugging log
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message); // Debugging log
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
