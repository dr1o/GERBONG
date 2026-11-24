import "dotenv/config";

export function adminAuth(req, res, next) {
  const expectedToken = process.env.ADMIN_TOKEN;
  const authHeader = req.headers.authorization || "";

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({
      error: "Unauthorized: Valid admin Bearer token required",
    });
  }

  return next();
}

export default adminAuth;
