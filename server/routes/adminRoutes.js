const express = require("express");
const { body } = require("express-validator");
const { adminLogin, getAllRequests, getDrivers } = require("../controllers/adminController");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 1 })],
  adminLogin
);

router.get("/requests", authRequired, requireRole("ADMIN"), getAllRequests);
router.get("/drivers", authRequired, requireRole("ADMIN"), getDrivers);

module.exports = router;

