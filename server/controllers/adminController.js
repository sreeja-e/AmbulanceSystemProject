const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../utils/prisma");

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function adminLogin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || user.role !== "ADMIN") return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user);
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

async function getAllRequests(req, res) {
  const requests = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ambulance: {
        include: { driver: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  return res.json({ requests });
}

async function getDrivers(req, res) {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    orderBy: { createdAt: "desc" },
    include: { ambulance: true },
  });
  return res.json({ drivers });
}

module.exports = { adminLogin, getAllRequests, getDrivers };

