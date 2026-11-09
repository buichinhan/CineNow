
const express = require("express");
const router = express.Router();

const {
  requireAuth,
  requireAdmin,
} = require("../middleware/adminAuth");

// API kiểm tra tài khoản quản trị
router.get("/me", requireAuth, requireAdmin, (req, res) => {
  const user = req.authUser;

  return res.json({
    success: true,
    message: "Xác thực Admin thành công.",
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = router;
