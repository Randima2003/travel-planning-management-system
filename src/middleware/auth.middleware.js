const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const cookieName = process.env.AUTH_COOKIE_NAME || "venturevista.sid";
  const token = req.cookies?.[cookieName];

  if (!token) {
    return res.status(401).json({ success: false, message: "Please log in" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(payload.sub);
    if (!Number.isSafeInteger(req.userId)) throw new Error("Invalid user id");
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Your session has expired. Please log in again." });
  }
}

module.exports = { requireAuth };
