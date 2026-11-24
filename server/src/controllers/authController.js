import "dotenv/config";

export const authController = {
  login(req, res) {
    const { password } = req.body || {};
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const token = process.env.ADMIN_TOKEN;

    if (
      typeof password === "string" &&
      Boolean(expectedPassword) &&
      password === expectedPassword
    ) {
      return res.status(200).json({
        token,
        role: "admin",
      });
    }

    return res.status(401).json({
      error: "Password admin tidak valid",
    });
  },

  verify(req, res) {
    return res.status(200).json({
      valid: true,
      role: "admin",
    });
  },
};

export default authController;
