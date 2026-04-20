const express = require("express");
const { body } = require("express-validator");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { createRequest, getRequest } = require("../controllers/requestController");

const router = express.Router();

router.post(
  "/create",
  authRequired,
  requireRole("USER"),
  [body("lat").isFloat({ min: -90, max: 90 }), body("lng").isFloat({ min: -180, max: 180 })],
  createRequest
);

router.get("/:id", authRequired, getRequest);

module.exports = router;

