const jwt = require("jsonwebtoken");

const jwtAuthMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization)
    return res.status(401).json({ error: "Token is not found" });
  const token = req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRETKEY); // (token, Masai)
    console.log("Decoded JWT Payload:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: "Invalid token" });
  }
};

const generateToken = (userData) => {
  const payload = {
    id: userData.id, // User ID
    email: userData.email, // Using email instead of username
  };
  return jwt.sign(payload, process.env.JWT_SECRETKEY, { expiresIn: "3000s" });
};

module.exports = { jwtAuthMiddleware, generateToken };
